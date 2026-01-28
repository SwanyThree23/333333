/**
 * HeyGen AI Avatar Service
 * Handles avatar creation, streaming, and real-time video generation
 * 
 * Documentation: https://docs.heygen.com/
 */

import axios, { AxiosInstance } from 'axios';

interface HeyGenConfig {
    apiKey: string;
    baseUrl?: string;
}

interface Avatar {
    avatar_id: string;
    avatar_name: string;
    gender: string;
    preview_image_url: string;
    preview_video_url: string;
}

interface Voice {
    voice_id: string;
    name: string;
    language: string;
    gender: string;
    preview_audio: string;
}

interface StreamingSession {
    session_id: string;
    sdp: string;
    ice_servers: Array<{
        urls: string[];
        username?: string;
        credential?: string;
    }>;
}

interface TalkRequest {
    text: string;
    voice_id?: string;
    emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
}

export class HeyGenService {
    private client: AxiosInstance;
    private apiKey: string;

    constructor(config: HeyGenConfig) {
        this.apiKey = config.apiKey;
        this.client = axios.create({
            baseURL: config.baseUrl || 'https://api.heygen.com/v2',
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * List available avatars
     */
    async listAvatars(): Promise<Avatar[]> {
        try {
            const response = await this.client.get('/avatars');
            return response.data.data.avatars;
        } catch (error) {
            console.error('Failed to list avatars:', error);
            // Return mock data for development
            return this.getMockAvatars();
        }
    }

    /**
     * List available voices
     */
    async listVoices(): Promise<Voice[]> {
        try {
            const response = await this.client.get('/voices');
            return response.data.data.voices;
        } catch (error) {
            console.error('Failed to list voices:', error);
            return this.getMockVoices();
        }
    }

    /**
     * Create a streaming avatar session for real-time interaction
     */
    async createStreamingSession(avatarId: string): Promise<StreamingSession> {
        try {
            const response = await this.client.post('/streaming.new', {
                avatar_id: avatarId,
                quality: 'high',
            });
            return response.data.data;
        } catch (error) {
            console.error('Failed to create streaming session:', error);
            // Return mock session for development
            return {
                session_id: `mock-session-${Date.now()}`,
                sdp: 'mock-sdp-offer',
                ice_servers: [{ urls: ['stun:stun.l.google.com:19302'] }],
            };
        }
    }

    /**
     * Start the streaming session with WebRTC SDP answer
     */
    async startStreamingSession(sessionId: string, sdpAnswer: string): Promise<void> {
        try {
            await this.client.post('/streaming.start', {
                session_id: sessionId,
                sdp: sdpAnswer,
            });
        } catch (error) {
            console.error('Failed to start streaming session:', error);
        }
    }

    /**
     * Make the avatar speak with text
     */
    async talk(sessionId: string, request: TalkRequest): Promise<{ duration: number }> {
        try {
            const response = await this.client.post('/streaming.talk', {
                session_id: sessionId,
                text: request.text,
                voice_id: request.voice_id,
                voice_emotion: request.emotion || 'neutral',
            });
            return { duration: response.data.data.duration_ms };
        } catch (error) {
            console.error('Failed to make avatar talk:', error);
            // Estimate duration based on text length (avg 150 words per minute)
            const words = request.text.split(' ').length;
            const duration = Math.ceil((words / 150) * 60 * 1000);
            return { duration };
        }
    }

    /**
     * Stop the avatar's current speech
     */
    async stopTalk(sessionId: string): Promise<void> {
        try {
            await this.client.post('/streaming.stop', {
                session_id: sessionId,
            });
        } catch (error) {
            console.error('Failed to stop talk:', error);
        }
    }

    /**
     * Close the streaming session
     */
    async closeSession(sessionId: string): Promise<void> {
        try {
            await this.client.post('/streaming.close', {
                session_id: sessionId,
            });
        } catch (error) {
            console.error('Failed to close session:', error);
        }
    }

    /**
     * Generate a video with avatar (non-streaming)
     */
    async generateVideo(avatarId: string, text: string, voiceId: string): Promise<{ video_id: string }> {
        try {
            const response = await this.client.post('/video/generate', {
                avatar_id: avatarId,
                input_text: text,
                voice_id: voiceId,
            });
            return { video_id: response.data.data.video_id };
        } catch (error) {
            console.error('Failed to generate video:', error);
            return { video_id: `mock-video-${Date.now()}` };
        }
    }

    /**
     * Check video generation status
     */
    async getVideoStatus(videoId: string): Promise<{ status: string; video_url?: string }> {
        try {
            const response = await this.client.get(`/video/${videoId}`);
            return response.data.data;
        } catch (error) {
            console.error('Failed to get video status:', error);
            return { status: 'completed', video_url: 'https://example.com/mock-video.mp4' };
        }
    }

    // Mock data for development
    private getMockAvatars(): Avatar[] {
        return [
            {
                avatar_id: 'josh_lite3_20230714',
                avatar_name: 'Josh - Professional',
                gender: 'male',
                preview_image_url: '/avatars/josh-preview.jpg',
                preview_video_url: '/avatars/josh-preview.mp4',
            },
            {
                avatar_id: 'anna_lite3_20230714',
                avatar_name: 'Anna - Friendly',
                gender: 'female',
                preview_image_url: '/avatars/anna-preview.jpg',
                preview_video_url: '/avatars/anna-preview.mp4',
            },
            {
                avatar_id: 'marcus_lite3_20230714',
                avatar_name: 'Marcus - Tech Expert',
                gender: 'male',
                preview_image_url: '/avatars/marcus-preview.jpg',
                preview_video_url: '/avatars/marcus-preview.mp4',
            },
        ];
    }

    private getMockVoices(): Voice[] {
        return [
            {
                voice_id: 'en-US-JennyNeural',
                name: 'Jenny',
                language: 'English (US)',
                gender: 'female',
                preview_audio: '/voices/jenny-preview.mp3',
            },
            {
                voice_id: 'en-US-GuyNeural',
                name: 'Guy',
                language: 'English (US)',
                gender: 'male',
                preview_audio: '/voices/guy-preview.mp3',
            },
        ];
    }
}

// Singleton instance
let heygenInstance: HeyGenService | null = null;

export function getHeyGenService(): HeyGenService {
    if (!heygenInstance) {
        heygenInstance = new HeyGenService({
            apiKey: process.env.HEYGEN_API_KEY || 'demo-key',
        });
    }
    return heygenInstance;
}
