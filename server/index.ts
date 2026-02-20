import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Import services
import { getHeyGenService } from './services/heygen';
import { getElevenLabsService } from './services/elevenlabs';
import { getOpenAIService } from './services/openai';
import { getStreamService } from './services/stream';
import { getDatabase } from './services/database';
import { getAuditService } from './services/enterprise/audit';
import { getAIDirectorService } from './services/ai-director';
import { getNotificationService } from './services/enterprise/notification';

// Import modules
import { swaggerSpec } from './swagger';
import enterpriseRoutes from './routes/enterprise';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});

// Security layer
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development if needed, or configure properly
}));
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// Initialize services
const heygen = getHeyGenService();
const elevenlabs = getElevenLabsService();
const openai = getOpenAIService();
const streamService = getStreamService();
const db = getDatabase();
const audit = getAuditService();
const aiDirector = getAIDirectorService();
aiDirector.setSocketServer(io);

const notificationService = getNotificationService();
notificationService.setSocketServer(io);

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================
// Encryption Helpers (AES-256-GCM)
// ============================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // base64 32 bytes
if (!ENCRYPTION_KEY) {
    console.warn('ENCRYPTION_KEY not set — use for stream key encryption');
}

function encrypt(text: string) {
    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(payloadB64: string) {
    const data = Buffer.from(payloadB64, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);
    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}


// ============================================
// REST API Routes
// ============================================

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        version: '1.0.0-enterprise',
        timestamp: new Date().toISOString(),
        services: {
            database: await db.getStats(),
            activeStreams: streamService.getActiveStreams().length,
        }
    });
});

// AI Director Test Trigger
app.post('/api/test/director/event', async (req: Request, res: Response) => {
    try {
        const { type, data, streamId } = req.body;
        await aiDirector.handleEvent({ type, data, streamId });
        res.json({ success: true, message: `Event ${type} processed by AI Director` });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// --- Encryption API ---
app.post('/api/encrypt', (req, res) => {
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'value required' });
    try {
        const ct = encrypt(value);
        return res.json({ encrypted: ct });
    } catch (e) {
        return res.status(500).json({ error: 'encryption_failed' });
    }
});

app.post('/api/decrypt', (req, res) => {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: 'payload required' });
    try {
        const plain = decrypt(payload);
        return res.json({ value: plain });
    } catch (e) {
        return res.status(500).json({ error: 'decryption_failed' });
    }
});

// Enterprise Routes
app.use('/api/enterprise', enterpriseRoutes);

// --- Auth & User Routes ---
app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Basic check
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await (db as any).prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await (db as any).prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        });

        res.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.put('/api/users/:id/profile', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, bio, image,
            paypalHandle, cashappHandle, venmoHandle, zelleHandle, chimeHandle,
            instagramStreamKey, tiktokStreamKey, facebookStreamKey, youtubeStreamKey
        } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (image !== undefined) updateData.image = image;

        if (paypalHandle !== undefined) updateData.paypalHandle = paypalHandle;
        if (cashappHandle !== undefined) updateData.cashappHandle = cashappHandle;
        if (venmoHandle !== undefined) updateData.venmoHandle = venmoHandle;
        if (zelleHandle !== undefined) updateData.zelleHandle = zelleHandle;
        if (chimeHandle !== undefined) updateData.chimeHandle = chimeHandle;

        if (instagramStreamKey) updateData.instagramStreamKey = encrypt(instagramStreamKey);
        if (tiktokStreamKey) updateData.tiktokStreamKey = encrypt(tiktokStreamKey);
        if (facebookStreamKey) updateData.facebookStreamKey = encrypt(facebookStreamKey);
        if (youtubeStreamKey) updateData.youtubeStreamKey = encrypt(youtubeStreamKey);

        const user = await (db as any).prisma.user.update({
            where: { id },
            data: updateData
        });

        // Safe return (no stream keys sent back)
        const safeUser = { ...user };
        delete safeUser.password;
        delete safeUser.instagramStreamKey;
        delete safeUser.tiktokStreamKey;
        delete safeUser.facebookStreamKey;
        delete safeUser.youtubeStreamKey;

        res.json({ success: true, user: safeUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Temporary Test Endpoint
app.post('/api/test/seed', async (req: Request, res: Response) => {
    try {
        // Create admin user
        const admin = await (db as any).prisma.user.upsert({
            where: { email: 'admin@swanythree.com' },
            update: {},
            create: {
                name: 'Admin User',
                email: 'admin@swanythree.com',
                role: 'ADMIN',
            }
        });

        // Create test enterprise user
        const user = await (db as any).prisma.user.upsert({
            where: { email: 'director-test@example.com' },
            update: {},
            create: {
                name: 'Director Test',
                email: 'director-test@example.com',
                role: 'ENTERPRISE',
            }
        });

        // Seed subscription
        await (db as any).prisma.subscription.upsert({
            where: { stripeSubscriptionId: 'sub_test_123' },
            update: {},
            create: {
                userId: user.id,
                planId: 'enterprise',
                status: 'active',
                stripeSubscriptionId: 'sub_test_123'
            }
        });

        // Create test stream
        const stream = await (db as any).prisma.stream.create({
            data: {
                userId: user.id,
                title: 'Enterprise Live Event',
                status: 'live',
                aiDirectorEnabled: true
            }
        });

        // Add to stream service to make it "active"
        streamService.addStream(stream.id, stream as any);

        res.json({ adminId: admin.id, userId: user.id, streamId: stream.id, enterprise: true });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: String(error) });
    }
});

// ---- Stream Routes ----
app.post('/api/streams', async (req: Request, res: Response) => {
    try {
        const { userId, title, description, platforms, quality } = req.body;

        // Create stream in database
        const dbStream = await db.createStream({
            userId: userId || 'anonymous',
            title,
            description,
            status: 'scheduled',
            platforms: platforms || [],
            settings: { quality: quality || '1080p30' },
        });

        // Seed default scenes for the new stream
        const defaultScenes = [
            { name: 'Main Scene', layout: 'single', order: 0 },
            { name: 'Interview', layout: 'side-by-side', order: 1 },
            { name: 'Screen Share', layout: 'pip', order: 2 },
            { name: 'BRB Screen', layout: 'single', order: 3 },
        ];

        for (const scene of defaultScenes) {
            await db.createScene({
                streamId: dbStream.id,
                ...scene,
                sources: [],
                isActive: scene.order === 0
            });
        }

        // Create stream in service
        const streamConfig = streamService.createStream({
            title,
            description,
            quality,
        });

        // Add platforms
        if (platforms) {
            for (const platform of platforms) {
                streamService.addPlatform(streamConfig.id, {
                    name: platform.name,
                    streamKey: platform.streamKey,
                    rtmpUrl: platform.rtmpUrl,
                    chatEnabled: true,
                });
            }
        }

        res.json({
            success: true,
            stream: { ...dbStream, configId: streamConfig.id }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create stream' });
    }
});

app.get('/api/streams/:id', async (req: Request, res: Response) => {
    const stream = await db.getStreamById(req.params.id);
    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }
    res.json(stream);
});

app.get('/api/streams/user/:userId', async (req: Request, res: Response) => {
    try {
        const streams = await db.getStreamsByUserId(req.params.userId);
        res.json(streams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user streams' });
    }
});

app.post('/api/streams/:id/start', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await streamService.startStream(id);

        if (result.success) {
            await db.updateStream(id, { status: 'live', startedAt: new Date() });
            io.emit('stream:started', { streamId: id });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start stream' });
    }
});

app.post('/api/streams/:id/stop', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await streamService.stopStream(id);
        await db.updateStream(id, { status: 'ended', endedAt: new Date() });
        io.emit('stream:ended', { streamId: id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop stream' });
    }
});

// ---- Avatar Routes ----
app.get('/api/avatars', async (req: Request, res: Response) => {
    const avatars = await heygen.listAvatars();
    res.json(avatars);
});

app.get('/api/voices', async (req: Request, res: Response) => {
    const [heygenVoices, elevenLabsVoices] = await Promise.all([
        heygen.listVoices(),
        elevenlabs.listVoices(),
    ]);
    res.json({
        heygen: heygenVoices,
        elevenlabs: elevenLabsVoices
    });
});

app.post('/api/avatar/session', async (req: Request, res: Response) => {
    try {
        const { avatarId, streamId } = req.body;
        const session = await heygen.createStreamingSession(avatarId);

        // Store session in database
        await db.createAvatarSession({
            streamId,
            avatarId,
            provider: 'heygen',
            sessionToken: session.session_id,
            status: 'idle',
        });

        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create avatar session' });
    }
});

app.post('/api/avatar/session/start', async (req: Request, res: Response) => {
    try {
        const { sessionId, sdpAnswer } = req.body;
        await heygen.startStreamingSession(sessionId, sdpAnswer);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start avatar session' });
    }
});

app.post('/api/avatar/speak', async (req: Request, res: Response) => {
    try {
        const { sessionId, streamId, text, voiceId, useElevenLabs } = req.body;

        let duration: number;

        if (useElevenLabs) {
            // Generate audio with ElevenLabs (higher quality)
            duration = elevenlabs.estimateDuration(text);
            // In production, this would actually generate and stream audio
        } else {
            // Use HeyGen's built-in TTS
            const result = await heygen.talk(sessionId, { text, voice_id: voiceId });
            duration = result.duration;
        }

        // Update avatar status
        const avatarSession = await db.getAvatarSession(streamId);
        if (avatarSession) {
            await db.updateAvatarStatus(avatarSession.id, 'speaking');

            // Reset status after speech
            setTimeout(async () => {
                await db.updateAvatarStatus(avatarSession.id, 'idle');
                io.to(`stream:${streamId}`).emit('avatar:finished', { sessionId });
            }, duration);
        }

        // Emit to stream viewers
        io.to(`stream:${streamId}`).emit('avatar:speaking', { text, duration });

        res.json({ success: true, duration });
    } catch (error) {
        res.status(500).json({ error: 'Failed to make avatar speak' });
    }
});

app.post('/api/avatar/stop', async (req: Request, res: Response) => {
    try {
        const { sessionId, streamId } = req.body;
        await heygen.stopTalk(sessionId);

        const avatarSession = await db.getAvatarSession(streamId);
        if (avatarSession) {
            await db.updateAvatarStatus(avatarSession.id, 'idle');
        }

        io.to(`stream:${streamId}`).emit('avatar:stopped', { sessionId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop avatar' });
    }
});

// ---- AI Features Routes ----
app.post('/api/ai/moderate', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        const result = await openai.moderateContent(text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to moderate content' });
    }
});

app.post('/api/ai/generate-script', async (req: Request, res: Response) => {
    try {
        const { topic, style, duration } = req.body;
        const script = await openai.generateScript(topic, style, duration);
        res.json({ script });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate script' });
    }
});

app.post('/api/ai/suggest-scene', async (req: Request, res: Response) => {
    try {
        const { currentScene, chatHistory, availableScenes } = req.body;
        const suggestion = await openai.suggestSceneChange(currentScene, chatHistory, availableScenes);
        res.json(suggestion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to suggest scene' });
    }
});

app.post('/api/ai/chat-response', async (req: Request, res: Response) => {
    try {
        const { question, streamTopic, previousResponses } = req.body;
        const response = await openai.generateChatResponse(question, {
            streamTopic,
            previousResponses: previousResponses || []
        });
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

app.post('/api/ai/analyze-engagement', async (req: Request, res: Response) => {
    try {
        const { streamId, viewerCount, chatActivity, sceneChanges } = req.body;
        const insights = await openai.analyzeEngagement(viewerCount, chatActivity, sceneChanges);

        if (streamId) {
            await db.updateStreamConfig(streamId, { latestAiInsights: insights });
        }

        res.json({ insights });
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze engagement' });
    }
});

app.get('/api/streams/:streamId/director-events', async (req: Request, res: Response) => {
    try {
        const events = await db.getDirectorEvents(req.params.streamId);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get director events' });
    }
});

app.post('/api/streams/:streamId/config', async (req: Request, res: Response) => {
    try {
        const { aiDirectorEnabled } = req.body;
        await db.updateStreamConfig(req.params.streamId, { aiDirectorEnabled });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update stream configuration' });
    }
});

app.post('/api/streams/:streamId/director-events', async (req: Request, res: Response) => {
    try {
        const { type, message, metadata } = req.body;
        const event = await db.recordDirectorEvent({
            streamId: req.params.streamId,
            type,
            message,
            metadata,
            timestamp: new Date()
        });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to record director event' });
    }
});

app.post('/api/ai/generate-metadata', async (req: Request, res: Response) => {
    try {
        const { title, topic } = req.body;
        const metadata = await openai.generateStreamMetadata(title, topic);
        res.json(metadata);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate metadata' });
    }
});

// ---- Guest Routes ----
app.post('/api/guests', async (req: Request, res: Response) => {
    try {
        const { streamId, name, email } = req.body;
        const guest = await db.createGuest({ streamId, name, email, status: 'invited' });

        io.to(`stream:${streamId}`).emit('guest:invited', guest);
        res.json({ success: true, guest });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create guest' });
    }
});

app.get('/api/guests/:streamId', async (req: Request, res: Response) => {
    const guests = await db.getGuestsByStreamId(req.params.streamId);
    res.json(guests);
});

app.post('/api/guests/join/:code', async (req: Request, res: Response) => {
    try {
        const guest = await db.getGuestByInviteCode(req.params.code);
        if (!guest) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        await db.updateGuestStatus(guest.id, 'connected');
        io.to(`stream:${guest.streamId} `).emit('guest:joined', guest);

        res.json({ success: true, guest });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join' });
    }
});

// ---- Analytics Routes ----
app.get('/api/analytics/:streamId', async (req: Request, res: Response) => {
    try {
        const { streamId } = req.params;
        const stream = streamService.getStream(streamId);
        const stats = streamService.getStats(streamId);
        const analytics = await db.getLatestAnalytics(streamId);

        res.json({
            streamId,
            totalViewers: stream ? streamService.getTotalViewers(streamId) : 0,
            peakViewers: stats?.peakViewers || 0,
            ...analytics,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

// ---- Scene Routes ----
app.get('/api/scenes/:streamId', async (req: Request, res: Response) => {
    const scenes = await db.getScenesByStreamId(req.params.streamId);
    res.json(scenes);
});

app.post('/api/scenes', async (req: Request, res: Response) => {
    try {
        const { streamId, name, layout, sources, order } = req.body;
        const scene = await db.createScene({
            streamId,
            name,
            layout: layout || 'single',
            sources: sources || [],
            order: order || 0,
            isActive: false,
        });

        io.to(`stream:${streamId}`).emit('scene:created', scene);
        res.json({ success: true, scene });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create scene' });
    }
});

app.post('/api/scenes/:streamId/activate/:sceneId', async (req: Request, res: Response) => {
    try {
        const { streamId, sceneId } = req.params;
        await db.setActiveScene(streamId, sceneId);

        io.to(`stream:${streamId}`).emit('scene:switched', { sceneId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to switch scene' });
    }
});

// ============================================
// WebSocket Events
// ============================================

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} `);

    // Join stream room
    socket.on('stream:join', (streamId: string) => {
        socket.join(`stream:${streamId}`);
        console.log(`Client ${socket.id} joined stream ${streamId}`);
    });

    // Leave stream room
    socket.on('stream:leave', (streamId: string) => {
        socket.leave(`stream:${streamId}`);
    });

    // Chat message
    socket.on('chat:message', async (data) => {
        const { streamId, platform, username, message, donation } = data;

        // Moderate message
        const moderation = await openai.moderateContent(message);

        // Save to database
        const chatMessage = await db.addChatMessage({
            streamId,
            platform,
            username,
            message,
            badges: data.badges || [],
            highlighted: data.highlighted || !!donation,
            donation,
            timestamp: new Date(),
            moderated: moderation.flagged,
            moderationReason: moderation.flagged ? 'Flagged by AI' : undefined,
        });

        // Only broadcast if not moderated
        if (!moderation.flagged) {
            io.to(`stream:${streamId}`).emit('chat:message', chatMessage);

            // Trigger AI Director analysis for chat-based events
            aiDirector.handleEvent({
                type: 'chat',
                streamId,
                data: { chatMessage: message, username }
            }).catch(e => console.error('[AI Director] Chat handle error:', e));
        }
    });

    // Scene switch request
    socket.on('scene:switch', async (data) => {
        const { streamId, sceneId } = data;
        await db.setActiveScene(streamId, sceneId);
        io.to(`stream:${streamId}`).emit('scene:switched', { sceneId });
    });

    // Avatar speak request
    socket.on('avatar:speak', async (data) => {
        const { streamId, text, avatarId } = data;
        const session = await db.getAvatarSession(streamId);

        if (session) {
            await db.updateAvatarStatus(session.id, 'speaking');

            const duration = elevenlabs.estimateDuration(text);
            io.to(`stream:${streamId}`).emit('avatar:speaking', {
                avatarId,
                text,
                duration
            });

            setTimeout(async () => {
                await db.updateAvatarStatus(session.id, 'idle');
                io.to(`stream:${streamId}`).emit('avatar:finished', { avatarId });
            }, duration);
        }
    });

    // --- Guest WebRTC Signaling ---
    // Guest joins signaling (sending offer to broadcaster)
    socket.on('guest:signal:offer', (data) => {
        const { streamId, offer, guestId } = data;
        // Forward offer to the broadcaster (who is in the stream room)
        io.to(`stream:${streamId}`).emit('guest:signal:offer', { offer, guestId, socketId: socket.id });
    });

    // Broadcaster sends answer to guest
    socket.on('guest:signal:answer', (data) => {
        const { targetSocketId, answer, guestId } = data;
        io.to(targetSocketId).emit('guest:signal:answer', { answer, guestId });
    });

    // ICE Candidate exchange
    socket.on('guest:signal:ice', (data) => {
        const { streamId, candidate, guestId, targetSocketId } = data;
        if (targetSocketId) {
            // Forward to specific client
            io.to(targetSocketId).emit('guest:signal:ice', { candidate, guestId });
        } else {
            // Forward to broadcaster
            io.to(`stream:${streamId}`).emit('guest:signal:ice', { candidate, guestId, socketId: socket.id });
        }
    });

    // Viewer count simulation (for development)
    socket.on('simulate:viewers', (data) => {
        const { streamId, count } = data;
        streamService.updateViewerCount(streamId, 'mock-platform', count);
        io.to(`stream:${streamId}`).emit('stream:viewers', { count });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id} `);
    });
});

// ============================================
// Analytics Loop (runs every 5 seconds for active streams)
// ============================================
setInterval(async () => {
    const activeStreams = streamService.getActiveStreams();

    for (const stream of activeStreams) {
        const currentViewers = streamService.getTotalViewers(stream.id);
        const chatMessages = (await db.getChatMessages(stream.id, 1000)).length;

        await db.recordAnalytics({
            streamId: stream.id,
            timestamp: new Date(),
            viewers: currentViewers,
            chatMessages,
            reactions: Math.floor(Math.random() * 50),
            shares: Math.floor(Math.random() * 10),
            newFollowers: Math.floor(Math.random() * 5),
            platformBreakdown: {},
        });

        // Periodic AI Director check
        aiDirector.handleEvent({
            type: 'analytics',
            streamId: stream.id,
            data: { viewers: currentViewers, chatRate: chatMessages / 5 } // approx per min
        }).catch(e => console.error('[AI Director] Analytics handle error:', e));
    }
}, 5000);

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`
  🚀 AI Avatar Livestream Server(Enterprise Edition)
    ==================================================
    Server: http://localhost:${PORT}
WebSocket: ws://localhost:${PORT}
Docs: http://localhost:${PORT}/api-docs
  
  Services initialized:
- HeyGen Avatar Service
    - ElevenLabs TTS Service
        - OpenAI AI Service
            - Stream Service
                - Database Service(Neon)
                    - Audit & Compliance Service
                        - Payment & Billing Service
                            `);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');

    // Stop analytics interval...

    httpServer.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });

    // Close database
    await db.disconnect();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { io };
