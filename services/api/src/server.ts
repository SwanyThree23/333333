import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { body, validationResult } from 'express-validator';
// Use require for Prisma client to avoid ESM named-export resolution issues
const { PrismaClient } = require('@prisma/client');
import Redis from 'ioredis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import Stripe from 'stripe';

// Environment
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const AVATAR_CONTROLLER_URL = process.env.AVATAR_CONTROLLER_URL || 'http://localhost:8011';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

const prisma = new PrismaClient();
const redis = new Redis(REDIS_URL);
const stripe = new Stripe(STRIPE_SECRET_KEY || '', { apiVersion: '2024-11-01' } as any);

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
    cors: { origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }
});

// In-memory viewer tracking (for demo). In prod, use Redis or TimescaleDB.
const viewersByStream: Record<string, Set<string>> = {};

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(compression());
app.use(morgan('combined'));

// Request ID middleware
app.use((req, res, next) => {
    const id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-Id', String(id));
    (req as any).requestId = id;
    next();
});

// Response time tracking
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        res.setHeader('X-Response-Time-ms', String(ms));
    });
    next();
});

// Rate limiter: 100 requests / 15 minutes per IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Error wrapper helper
function asyncHandler(fn: any) {
    return function (req: any, res: any, next: any) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Generate JWT access token
function signAccessToken(userId: string) {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '15m' });
}

// Generate refresh token (and persist in Redis)
async function createRefreshToken(userId: string) {
    const token = crypto.randomBytes(48).toString('hex');
    const key = `refresh:${token}`;
    // store mapping token -> userId, expire in 30 days
    await redis.set(key, userId, 'EX', 60 * 60 * 24 * 30);
    return token;
}

// Verify refresh token
async function verifyRefreshToken(token: string) {
    const key = `refresh:${token}`;
    const userId = await redis.get(key);
    return userId;
}

// JWT auth middleware
async function jwtAuth(req: any, res: any, next: any) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
    const parts = String(auth).split(' ');
    if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization header' });

    const token = parts[1];
    try {
        const payload: any = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// --------- Auth Routes ---------
app.post('/api/auth/register',
    body('email').isEmail(),
    body('username').isLength({ min: 3 }),
    body('password').isLength({ min: 8 }),
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, username, password } = req.body;
        const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
        if (existing) return res.status(400).json({ error: 'Email or username already taken' });

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, username, password: hashed } });

        const accessToken = signAccessToken(user.id);
        const refreshToken = await createRefreshToken(user.id);

        res.json({ token: accessToken, refreshToken, user: { id: user.id, email: user.email, username: user.username } });
    })
);

app.post('/api/auth/login',
    body('email').isEmail(),
    body('password').isString(),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

        const accessToken = signAccessToken(user.id);
        const refreshToken = await createRefreshToken(user.id);

        res.json({ token: accessToken, refreshToken, user: { id: user.id, email: user.email, username: user.username } });
    })
);

app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });
    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) return res.status(401).json({ error: 'Invalid refresh token' });
    const accessToken = signAccessToken(userId);
    res.json({ token: accessToken });
}));

// Logout: invalidate refresh token
app.post('/api/auth/logout', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });
    await redis.del(`refresh:${refreshToken}`);
    res.json({ success: true });
}));

// --------- Stream Management ---------
app.post('/api/streams/start', jwtAuth, body('title').isString(), asyncHandler(async (req: any, res: any) => {
    const { title, platforms = ['twitch', 'youtube'] } = req.body;
    const user = req.user;

    // generate strong stream key
    const streamKey = crypto.randomBytes(24).toString('hex');
    const rtmpUrl = process.env.RTMP_URL || 'rtmp://nginx/live';

    const stream = await prisma.stream.create({
        data: {
            userId: user.id,
            title,
            game: null,
            description: null,
            platforms: platforms as any,
            status: 'live',
            streamKey,
            rtmpUrl,
            startedAt: new Date()
        }
    });

    // initialize analytics row
    await prisma.streamAnalytics.create({ data: { streamId: stream.id, platformStats: {}, hourlyStats: {} } });

    // notify via websocket
    io.emit('stream:started', { streamId: stream.id, title: stream.title, user: { id: user.id, username: user.username } });

    res.json({ streamId: stream.id, streamKey, rtmpUrl });
}));

app.post('/api/streams/stop', jwtAuth, body('streamId').isString(), asyncHandler(async (req: any, res: any) => {
    const { streamId } = req.body;
    const stream = await prisma.stream.findUnique({ where: { id: streamId } });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    if (stream.status !== 'live') return res.status(400).json({ error: 'Stream is not live' });

    const endedAt = new Date();
    const duration = Math.max(0, Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000));

    await prisma.stream.update({ where: { id: streamId }, data: { status: 'ended', endedAt, duration } });

    io.emit('stream:ended', { streamId, endedAt });
    res.json({ success: true, streamId, endedAt, duration });
}));

app.get('/api/streams/:id/stats', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const analytics = await prisma.streamAnalytics.findUnique({ where: { streamId: id } });
    if (!analytics) return res.status(404).json({ error: 'Analytics not found' });
    res.json({ analytics });
}));

// --------- Chat Integration ---------
// Simple profanity filter and command parser
const PROFANITY = ['badword1', 'badword2'];

function moderateMessage(message: string) {
    let cleaned = message;
    PROFANITY.forEach(p => {
        const re = new RegExp(p, 'ig');
        cleaned = cleaned.replace(re, '****');
    });
    return cleaned;
}

app.post('/api/chat/:streamId',
    body('message').isString(),
    body('username').isString(),
    asyncHandler(async (req: any, res: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { streamId } = req.params;
        const { message, username, platform = 'chat' } = req.body;

        const cleaned = moderateMessage(message);
        const isCommand = cleaned.startsWith('!');

        // Save
        const chat = await prisma.chatMessage.create({
            data: {
                userId: null as any, // anonymous or later resolved
                streamId,
                platform,
                username,
                message: cleaned,
                isCommand
            }
        } as any);

        // Broadcast
        io.to(streamId).emit('chat:message', { id: chat.id, username, message: cleaned, platform, timestamp: chat.timestamp });

        // Command handling
        if (isCommand) {
            const parts = cleaned.slice(1).split(' ');
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1).join(' ');

            if (cmd === 'avatar') {
                // call avatar controller to speak
                try {
                    const avatarRes = await fetch(`${AVATAR_CONTROLLER_URL}/speak`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: args || 'Hello from SwanyThree avatar' })
                    });
                    const j = await avatarRes.json();
                    io.to(streamId).emit('avatar:speaking', { text: j.text, emotion: j.emotion, audioUrl: j.audioUrl });
                } catch (e: any) {
                    console.error('avatar call failed', e?.message || e);
                }
            }

            if (cmd === 'game') {
                io.to(streamId).emit('game:detected', { game: args || 'unknown', confidence: 0.5, method: 'manual' });
            }

            if (cmd === 'stats') {
                const analytics = await prisma.streamAnalytics.findUnique({ where: { streamId } });
                io.to(streamId).emit('stats:update', analytics || {});
            }
        }

        res.json({ success: true, chat });
    })
);

// Chat replay endpoint
app.get('/api/streams/:id/chat', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const messages = await prisma.chatMessage.findMany({ where: { streamId: id }, orderBy: { timestamp: 'asc' } });
    res.json({ messages });
}));

// --------- Stripe Webhook Handler ---------
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), asyncHandler(async (req: any, res: any) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    try {
        if (!STRIPE_SECRET_KEY) {
            // cannot verify signature without key, gracefully accept for local
            const event = JSON.parse(req.body.toString());
            await handleStripeEvent(event);
            res.json({ received: true });
            return;
        }

        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        const event = stripe.webhooks.constructEvent(req.body, sig || '', secret);
        await handleStripeEvent(event);
        res.json({ received: true });
    } catch (err: any) {
        console.error('stripe webhook error', err?.message || err);
        res.status(400).send(`Webhook Error: ${err?.message || err}`);
    }
}));

async function handleStripeEvent(event: any) {
    // Minimal processing of subscription events
    const type = event.type;
    if (type === 'customer.subscription.created' || type === 'customer.subscription.updated') {
        const sub = event.data.object;
        // find user by stripeCustomerId
        const user = await prisma.user.findUnique({ where: { stripeCustomerId: sub.customer } });
        if (user) {
            await prisma.subscription.upsert({
                where: { stripeSubscriptionId: sub.id },
                update: { plan: sub.items?.data?.[0]?.price?.id || 'unknown', status: sub.status, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
                create: { userId: user.id, plan: sub.items?.data?.[0]?.price?.id || 'unknown', status: sub.status, stripeSubscriptionId: sub.id, currentPeriodEnd: new Date(sub.current_period_end * 1000) }
            });
        }
    }
    // log
    await prisma.webhookLog.create({ data: { source: 'stripe', eventType: type, payload: event, success: true } });
}

// --------- OAuth integratons (basic) ---------
app.get('/api/oauth/:platform/callback', asyncHandler(async (req: any, res: any) => {
    const { platform } = req.params;
    const { code, state } = req.query;
    // exchange code for token (simplified - many providers differ)
    // For demo, create Integration record with pseudo-token
    const userId = state || null; // in a real flow state maps to user
    if (!userId) return res.status(400).json({ error: 'Missing state (userId)' });
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.integration.upsert({ where: { userId_platform: { userId: String(userId), platform } as any }, update: { accessToken: token, connected: true }, create: { userId: String(userId), platform, accessToken: token } } as any);
    res.send('Connected ' + platform);
}));

// --------- Socket.IO handlers ---------
io.on('connection', socket => {
    socket.on('join:stream', async (data: any) => {
        const { streamId, viewerId } = data;
        socket.join(streamId);
        viewersByStream[streamId] = viewersByStream[streamId] || new Set();
        viewersByStream[streamId].add(viewerId || socket.id);
        io.to(streamId).emit('viewer:joined', { viewerId: viewerId || socket.id, count: viewersByStream[streamId].size });

        // update analytics peak viewers
        const analytics = await prisma.streamAnalytics.findUnique({ where: { streamId } });
        if (analytics) {
            const viewers = viewersByStream[streamId].size;
            const peak = Math.max(analytics.peakViewers, viewers);
            await prisma.streamAnalytics.update({ where: { streamId }, data: { peakViewers: peak, avgViewers: Math.round((analytics.avgViewers + viewers) / 2) } });
        }
    });

    socket.on('leave:stream', async (data: any) => {
        const { streamId, viewerId } = data;
        socket.leave(streamId);
        if (viewersByStream[streamId]) {
            viewersByStream[streamId].delete(viewerId || socket.id);
            io.to(streamId).emit('viewer:left', { viewerId: viewerId || socket.id, count: viewersByStream[streamId].size });
        }
    });

    socket.on('disconnecting', () => {
        // best effort cleanup
    });
});

// --------- Analytics collector (runs every 5s) ---------
setInterval(async () => {
    try {
        for (const streamId of Object.keys(viewersByStream)) {
            const viewers = viewersByStream[streamId].size;
            const analytics = await prisma.streamAnalytics.findUnique({ where: { streamId } });
            if (!analytics) continue;
            const newTotalMessages = analytics.totalMessages; // would be incremented by message writes
            const hourly = analytics.hourlyStats || {};
            // update
            await prisma.streamAnalytics.update({ where: { streamId }, data: { peakViewers: Math.max(analytics.peakViewers, viewers), avgViewers: Math.round((analytics.avgViewers + viewers) / 2), totalMessages: newTotalMessages, hourlyStats: hourly } as any });
            // broadcast stats
            io.to(streamId).emit('stats:update', { streamId, viewers, peakViewers: Math.max(analytics.peakViewers, viewers) });
        }
    } catch (e) {
        console.error('analytics error', e);
    }
}, 5000);

// Health check
app.get('/health', asyncHandler(async (req, res) => {
    // quick db ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
}));

// Custom error handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error', err?.message || err, { requestId: req?.requestId });
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

server.listen(PORT, () => {
    console.log(`✅ SwanyThree API running on port ${PORT}`);
});
