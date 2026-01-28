import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 8011);
const INWORLD_API_KEY = process.env.INWORLD_API_KEY || '';
const INWORLD_CHARACTER_ID = process.env.INWORLD_CHARACTER_ID || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '';
const UNITY_BRIDGE_URL = process.env.UNITY_BRIDGE_URL || 'http://localhost:8011';
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// AvatarController: handles communicating with Inworld (or fallback), ElevenLabs TTS, and Unity bridge
class AvatarController {
    sessionId: string | null = null;
    characterId: string = INWORLD_CHARACTER_ID;

    // Initialize with Inworld session or create a lightweight fallback session
    async initialize() {
        if (!INWORLD_API_KEY || !this.characterId) {
            console.warn('INWORLD_API_KEY or INWORLD_CHARACTER_ID missing — using local echo for avatar responses');
            this.sessionId = `local-${uuidv4()}`;
            return;
        }

        const res = await fetch('https://api.inworld.ai/v1/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INWORLD_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ character: this.characterId, user: { id: 'streamer' } })
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Inworld init failed: ${res.status} ${txt}`);
        }

        const data = await res.json();
        this.sessionId = data.sessionId || data.id || null;
    }

    // Send text to Inworld or fallback echo
    async sendMessage(text: string) {
        if (!INWORLD_API_KEY || !this.sessionId || this.sessionId.startsWith('local-')) {
            // Simple deterministic fallback: echo with small transformation
            const reply = { text: `Avatar: ${text}`, emotion: 'neutral' };
            return reply;
        }

        const res = await fetch(`https://api.inworld.ai/v1/sessions/${this.sessionId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INWORLD_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, type: 'TEXT' })
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Inworld message failed: ${res.status} ${txt}`);
        }

        const data = await res.json();
        // Normalize expected shape
        return { text: data.text || data.output || '', emotion: data.emotion || 'neutral' };
    }

    // Generate speech using ElevenLabs and return local path
    async generateSpeech(text: string) {
        if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
            // fallback: create silent TTS placeholder file
            const fileName = `${Date.now()}-fallback.mp3`;
            const filePath = path.join(AUDIO_DIR, fileName);
            fs.writeFileSync(filePath, '');
            return { fileName, filePath };
        }

        const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
        const body = JSON.stringify({ text, model_id: 'eleven_monolingual_v1' });

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`ElevenLabs TTS failed: ${res.status} ${txt}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${Date.now()}-${uuidv4()}.mp3`;
        const filePath = path.join(AUDIO_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
        return { fileName, filePath };
    }

    // Trigger animation via Unity bridge
    async triggerAnimation(emotion: string, intensity = 1.0) {
        try {
            const res = await fetch(`${UNITY_BRIDGE_URL}/trigger-animation`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emotion, intensity })
            });
            if (!res.ok) {
                const txt = await res.text();
                console.warn('Unity bridge responded with non-OK:', res.status, txt);
            }
        } catch (err) {
            console.warn('Failed to contact Unity bridge', err);
        }
    }
}

const avatar = new AvatarController();
avatar.initialize().catch(err => console.error('Avatar init failed', err));

// Routes
app.post('/speak', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text' });

        const aiResponse = await avatar.sendMessage(text);
        const tts = await avatar.generateSpeech(aiResponse.text || text);
        await avatar.triggerAnimation(aiResponse.emotion || 'neutral');

        // Notify N8N if configured
        if (process.env.N8N_WEBHOOK_URL) {
            try {
                await fetch(`${process.env.N8N_WEBHOOK_URL}/avatar-spoke`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: aiResponse.text, emotion: aiResponse.emotion, timestamp: Date.now() })
                });
            } catch (err) {
                console.warn('Failed to notify N8N', err);
            }
        }

        res.json({ text: aiResponse.text, emotion: aiResponse.emotion, audioUrl: `/audio/${tts.fileName}` });
    } catch (err: any) {
        console.error('speak error', err?.message || err);
        res.status(500).json({ error: err?.message || 'internal' });
    }
});

app.post('/react', async (req, res) => {
    try {
        const { event, data } = req.body;
        if (!event) return res.status(400).json({ error: 'Missing event' });

        const reaction = await avatar.sendMessage(`React to this ${event}: ${JSON.stringify(data || {})}`);
        const tts = await avatar.generateSpeech(reaction.text || '...');
        await avatar.triggerAnimation(reaction.emotion || 'surprised');

        res.json({ reaction: reaction.text, audioUrl: `/audio/${tts.fileName}` });
    } catch (err: any) {
        console.error('react error', err?.message || err);
        res.status(500).json({ error: err?.message || 'internal' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', sessionId: avatar.sessionId });
});

// Serve generated audio files
app.use('/audio', express.static(path.join(process.cwd(), 'public', 'audio')));

app.listen(PORT, () => console.log(`✅ Avatar Controller running on port ${PORT}`));
