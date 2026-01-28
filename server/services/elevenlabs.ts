/**
 * ElevenLabs Text-to-Speech Service
 * Handles voice synthesis with ultra-realistic AI voices
 * 
 * Documentation: https://docs.elevenlabs.io/
 */

import axios, { AxiosInstance } from 'axios';

interface ElevenLabsConfig {
    apiKey: string;
    baseUrl?: string;
}

interface Voice {
    voice_id: string;
    name: string;
    category: string;
    description: string;
    preview_url: string;
    labels: Record<string, string>;
}

interface VoiceSettings {
    stability: number;        // 0-1, higher = more consistent
    similarity_boost: number; // 0-1, higher = more similar to original
    style?: number;           // 0-1, style exaggeration
    use_speaker_boost?: boolean;
}

interface TTSRequest {
    text: string;
    voice_id: string;
    model_id?: string;
    voice_settings?: VoiceSettings;
}

interface StreamingTTSRequest extends TTSRequest {
    optimize_streaming_latency?: number; // 0-4, higher = lower latency
}

export class ElevenLabsService {
    private client: AxiosInstance;
    private apiKey: string;
    private defaultVoiceSettings: VoiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
    };

    constructor(config: ElevenLabsConfig) {
        this.apiKey = config.apiKey;
        this.client = axios.create({
            baseURL: config.baseUrl || 'https://api.elevenlabs.io/v1',
            headers: {
                'xi-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * List all available voices
     */
    async listVoices(): Promise<Voice[]> {
        try {
            const response = await this.client.get('/voices');
            return response.data.voices;
        } catch (error) {
            console.error('Failed to list voices:', error);
            return this.getMockVoices();
        }
    }

    /**
     * Get details about a specific voice
     */
    async getVoice(voiceId: string): Promise<Voice | null> {
        try {
            const response = await this.client.get(`/voices/${voiceId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get voice:', error);
            return null;
        }
    }

    /**
     * Generate speech from text (returns audio buffer)
     */
    async textToSpeech(request: TTSRequest): Promise<Buffer> {
        try {
            const response = await this.client.post(
                `/text-to-speech/${request.voice_id}`,
                {
                    text: request.text,
                    model_id: request.model_id || 'eleven_multilingual_v2',
                    voice_settings: request.voice_settings || this.defaultVoiceSettings,
                },
                {
                    responseType: 'arraybuffer',
                }
            );
            return Buffer.from(response.data);
        } catch (error) {
            console.error('Failed to generate speech:', error);
            // Return empty buffer for development
            return Buffer.alloc(0);
        }
    }

    /**
     * Generate speech with streaming (returns readable stream)
     */
    async textToSpeechStream(request: StreamingTTSRequest): Promise<NodeJS.ReadableStream | null> {
        try {
            const response = await this.client.post(
                `/text-to-speech/${request.voice_id}/stream`,
                {
                    text: request.text,
                    model_id: request.model_id || 'eleven_turbo_v2',
                    voice_settings: request.voice_settings || this.defaultVoiceSettings,
                    optimize_streaming_latency: request.optimize_streaming_latency || 3,
                },
                {
                    responseType: 'stream',
                }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to stream speech:', error);
            return null;
        }
    }

    /**
     * Generate speech with WebSocket for real-time streaming
     * Returns WebSocket URL for connection
     */
    getWebSocketUrl(voiceId: string, modelId: string = 'eleven_turbo_v2'): string {
        return `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}`;
    }

    /**
     * Clone a voice from audio samples
     */
    async cloneVoice(name: string, description: string, audioFiles: Buffer[]): Promise<Voice | null> {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);

            audioFiles.forEach((file, index) => {
                formData.append('files', new Blob([file]), `sample_${index}.mp3`);
            });

            const response = await this.client.post('/voices/add', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to clone voice:', error);
            return null;
        }
    }

    /**
     * Get user subscription info and remaining characters
     */
    async getSubscription(): Promise<{ character_count: number; character_limit: number } | null> {
        try {
            const response = await this.client.get('/user/subscription');
            return {
                character_count: response.data.character_count,
                character_limit: response.data.character_limit,
            };
        } catch (error) {
            console.error('Failed to get subscription:', error);
            return { character_count: 0, character_limit: 10000 };
        }
    }

    /**
     * Get available models
     */
    async listModels(): Promise<Array<{ model_id: string; name: string; description: string }>> {
        try {
            const response = await this.client.get('/models');
            return response.data;
        } catch (error) {
            console.error('Failed to list models:', error);
            return [
                { model_id: 'eleven_multilingual_v2', name: 'Multilingual v2', description: 'Best quality, supports 29 languages' },
                { model_id: 'eleven_turbo_v2', name: 'Turbo v2', description: 'Fast generation, English only' },
                { model_id: 'eleven_monolingual_v1', name: 'English v1', description: 'Legacy English model' },
            ];
        }
    }

    // Calculate approximate duration based on text
    estimateDuration(text: string): number {
        // Average speaking rate: ~150 words per minute
        const words = text.split(/\s+/).length;
        return Math.ceil((words / 150) * 60 * 1000); // milliseconds
    }

    // Mock voices for development
    private getMockVoices(): Voice[] {
        return [
            {
                voice_id: '21m00Tcm4TlvDq8ikWAM',
                name: 'Rachel',
                category: 'premade',
                description: 'Calm and professional female voice',
                preview_url: 'https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/preview',
                labels: { accent: 'american', age: 'young', gender: 'female' },
            },
            {
                voice_id: 'AZnzlk1XvdvUeBnXmlld',
                name: 'Domi',
                category: 'premade',
                description: 'Strong and confident female voice',
                preview_url: 'https://api.elevenlabs.io/v1/voices/AZnzlk1XvdvUeBnXmlld/preview',
                labels: { accent: 'american', age: 'young', gender: 'female' },
            },
            {
                voice_id: 'EXAVITQu4vr4xnSDxMaL',
                name: 'Bella',
                category: 'premade',
                description: 'Soft and warm female voice',
                preview_url: 'https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
                labels: { accent: 'american', age: 'young', gender: 'female' },
            },
            {
                voice_id: 'ErXwobaYiN019PkySvjV',
                name: 'Antoni',
                category: 'premade',
                description: 'Well-rounded male voice',
                preview_url: 'https://api.elevenlabs.io/v1/voices/ErXwobaYiN019PkySvjV/preview',
                labels: { accent: 'american', age: 'young', gender: 'male' },
            },
            {
                voice_id: 'VR6AewLTigWG4xSOukaG',
                name: 'Arnold',
                category: 'premade',
                description: 'Deep and authoritative male voice',
                preview_url: 'https://api.elevenlabs.io/v1/voices/VR6AewLTigWG4xSOukaG/preview',
                labels: { accent: 'american', age: 'middle-aged', gender: 'male' },
            },
        ];
    }
}

// Singleton instance
let elevenLabsInstance: ElevenLabsService | null = null;

export function getElevenLabsService(): ElevenLabsService {
    if (!elevenLabsInstance) {
        elevenLabsInstance = new ElevenLabsService({
            apiKey: process.env.ELEVENLABS_API_KEY || 'demo-key',
        });
    }
    return elevenLabsInstance;
}
