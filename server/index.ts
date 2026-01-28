import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Import services
import { getHeyGenService } from './services/heygen';
import { getElevenLabsService } from './services/elevenlabs';
import { getOpenAIService } from './services/openai';
import { getStreamService } from './services/stream';
import { getDatabase } from './services/database';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

// Initialize services
const heygen = getHeyGenService();
const elevenlabs = getElevenLabsService();
const openai = getOpenAIService();
const streamService = getStreamService();
const db = getDatabase();

// ============================================
// REST API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: db.getStats(),
            activeStreams: streamService.getActiveStreams().length,
        }
    });
});

// ---- Stream Routes ----
app.post('/api/streams', async (req, res) => {
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

app.get('/api/streams/:id', async (req, res) => {
    const stream = await db.getStreamById(req.params.id);
    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }
    res.json(stream);
});

app.post('/api/streams/:id/start', async (req, res) => {
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

app.post('/api/streams/:id/stop', async (req, res) => {
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
app.get('/api/avatars', async (req, res) => {
    const avatars = await heygen.listAvatars();
    res.json(avatars);
});

app.get('/api/voices', async (req, res) => {
    const [heygenVoices, elevenLabsVoices] = await Promise.all([
        heygen.listVoices(),
        elevenlabs.listVoices(),
    ]);
    res.json({
        heygen: heygenVoices,
        elevenlabs: elevenLabsVoices
    });
});

app.post('/api/avatar/session', async (req, res) => {
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

app.post('/api/avatar/speak', async (req, res) => {
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

app.post('/api/avatar/stop', async (req, res) => {
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
app.post('/api/ai/moderate', async (req, res) => {
    try {
        const { text } = req.body;
        const result = await openai.moderateContent(text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to moderate content' });
    }
});

app.post('/api/ai/generate-script', async (req, res) => {
    try {
        const { topic, style, duration } = req.body;
        const script = await openai.generateScript(topic, style, duration);
        res.json({ script });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate script' });
    }
});

app.post('/api/ai/suggest-scene', async (req, res) => {
    try {
        const { currentScene, chatHistory, availableScenes } = req.body;
        const suggestion = await openai.suggestSceneChange(currentScene, chatHistory, availableScenes);
        res.json(suggestion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to suggest scene' });
    }
});

app.post('/api/ai/chat-response', async (req, res) => {
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

app.post('/api/ai/generate-metadata', async (req, res) => {
    try {
        const { title, topic } = req.body;
        const metadata = await openai.generateStreamMetadata(title, topic);
        res.json(metadata);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate metadata' });
    }
});

// ---- Guest Routes ----
app.post('/api/guests', async (req, res) => {
    try {
        const { streamId, name, email } = req.body;
        const guest = await db.createGuest({ streamId, name, email, status: 'invited' });

        io.to(`stream:${streamId}`).emit('guest:invited', guest);
        res.json({ success: true, guest });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create guest' });
    }
});

app.get('/api/guests/:streamId', async (req, res) => {
    const guests = await db.getGuestsByStreamId(req.params.streamId);
    res.json(guests);
});

app.post('/api/guests/join/:code', async (req, res) => {
    try {
        const guest = await db.getGuestByInviteCode(req.params.code);
        if (!guest) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        await db.updateGuestStatus(guest.id, 'connected');
        io.to(`stream:${guest.streamId}`).emit('guest:joined', guest);

        res.json({ success: true, guest });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join' });
    }
});

// ---- Analytics Routes ----
app.get('/api/analytics/:streamId', async (req, res) => {
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
app.get('/api/scenes/:streamId', async (req, res) => {
    const scenes = await db.getScenesByStreamId(req.params.streamId);
    res.json(scenes);
});

app.post('/api/scenes', async (req, res) => {
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

app.post('/api/scenes/:streamId/activate/:sceneId', async (req, res) => {
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
    console.log(`Client connected: ${socket.id}`);

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

    // Viewer count simulation (for development)
    socket.on('simulate:viewers', (data) => {
        const { streamId, count } = data;
        streamService.updateViewerCount(streamId, 'mock-platform', count);
        io.to(`stream:${streamId}`).emit('stream:viewers', { count });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
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
    }
}, 5000);

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`
  🚀 AI Avatar Livestream Server
  ================================
  Server:     http://localhost:${PORT}
  WebSocket:  ws://localhost:${PORT}
  
  API Endpoints:
  - POST /api/streams         Create new stream
  - POST /api/streams/:id/start  Start streaming
  - GET  /api/avatars         List available avatars
  - GET  /api/voices          List available voices
  - POST /api/avatar/speak    Make avatar speak
  - POST /api/ai/moderate     Moderate chat message
  - POST /api/ai/generate-script  Generate avatar script
  - GET  /api/analytics/:id   Get stream analytics
  
  Services initialized:
  - HeyGen Avatar Service
  - ElevenLabs TTS Service  
  - OpenAI AI Service
  - Stream Service
  - Database Service
  `);
});

export { io };
