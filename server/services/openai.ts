/**
 * OpenAI Service
 * Handles AI-powered features: chat moderation, content generation, scene suggestions
 * 
 * Documentation: https://platform.openai.com/docs
 */

import axios, { AxiosInstance } from 'axios';

interface OpenAIConfig {
    apiKey: string;
    baseUrl?: string;
    organization?: string;
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatCompletionRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

interface ModerationResult {
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
}

interface SceneSuggestion {
    name: string;
    description: string;
    layout: string;
    sources: string[];
    confidence: number;
}

export class OpenAIService {
    private client: AxiosInstance;
    private apiKey: string;

    constructor(config: OpenAIConfig) {
        this.apiKey = config.apiKey;
        this.client = axios.create({
            baseURL: config.baseUrl || 'https://api.openai.com/v1',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...(config.organization && { 'OpenAI-Organization': config.organization }),
            },
        });
    }

    /**
     * Generate chat completion
     */
    async chat(request: ChatCompletionRequest): Promise<string> {
        try {
            const response = await this.client.post('/chat/completions', {
                model: request.model || 'gpt-4-turbo-preview',
                messages: request.messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.max_tokens ?? 1000,
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Failed to generate chat completion:', error);
            return 'Sorry, I could not process your request at this time.';
        }
    }

    /**
     * Moderate chat content for inappropriate messages
     */
    async moderateContent(text: string): Promise<ModerationResult> {
        try {
            const response = await this.client.post('/moderations', {
                input: text,
            });
            return response.data.results[0];
        } catch (error) {
            console.error('Failed to moderate content:', error);
            return {
                flagged: false,
                categories: {},
                category_scores: {},
            };
        }
    }

    /**
     * Generate avatar script from topic/prompt
     */
    async generateScript(topic: string, style: string = 'professional', duration: number = 60): Promise<string> {
        const systemPrompt = `You are a professional script writer for AI avatar livestreams. 
    Write engaging, natural-sounding scripts that are meant to be spoken aloud.
    Keep the tone ${style} and aim for approximately ${duration} seconds of speaking time.
    Include natural pauses (indicated by ...) and emotional cues in [brackets].`;

        return this.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Write a script about: ${topic}` },
            ],
            temperature: 0.8,
            max_tokens: 500,
        });
    }

    /**
     * Suggest scene changes based on stream content
     */
    async suggestSceneChange(
        currentScene: string,
        chatHistory: string[],
        availableScenes: string[]
    ): Promise<SceneSuggestion | null> {
        const systemPrompt = `You are an AI stream director. Based on the current scene, recent chat activity, 
    and available scenes, suggest when and which scene to switch to for better engagement.
    Respond in JSON format with: { "name": "scene_name", "description": "reason for switch", 
    "layout": "suggested_layout", "sources": ["source1", "source2"], "confidence": 0.0-1.0 }`;

        try {
            const response = await this.chat({
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: `Current scene: ${currentScene}
            Recent chat: ${chatHistory.slice(-10).join('\n')}
            Available scenes: ${availableScenes.join(', ')}
            Should we switch scenes?`
                    },
                ],
                temperature: 0.5,
                max_tokens: 200,
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Failed to suggest scene:', error);
            return null;
        }
    }

    /**
     * Generate response to chat question for avatar to speak
     */
    async generateChatResponse(
        question: string,
        context: { streamTopic: string; previousResponses: string[] }
    ): Promise<string> {
        const systemPrompt = `You are an AI avatar host on a livestream about "${context.streamTopic}".
    Respond to viewer questions in a friendly, engaging manner.
    Keep responses concise (1-2 sentences) as they will be spoken aloud.
    Be helpful but also entertaining.`;

        return this.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                ...context.previousResponses.map(r => ({ role: 'assistant' as const, content: r })),
                { role: 'user', content: question },
            ],
            temperature: 0.8,
            max_tokens: 150,
        });
    }

    /**
     * Analyze stream engagement and provide insights
     */
    async analyzeEngagement(
        viewerCount: number[],
        chatActivity: number[],
        sceneChanges: string[]
    ): Promise<string> {
        const systemPrompt = `You are a stream analytics AI. Analyze the provided metrics and 
    give actionable insights to improve stream engagement. Be specific and practical.`;

        return this.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Viewer count over time: ${viewerCount.join(', ')}
          Chat messages per minute: ${chatActivity.join(', ')}
          Scene changes: ${sceneChanges.join(' -> ')}
          
          What insights can you provide?`,
                },
            ],
            temperature: 0.6,
            max_tokens: 300,
        });
    }

    /**
     * Generate hashtags and description for stream
     */
    async generateStreamMetadata(
        title: string,
        topic: string
    ): Promise<{ description: string; hashtags: string[]; tags: string[] }> {
        const systemPrompt = `You are a social media expert. Generate engaging metadata for a livestream.
    Respond in JSON: { "description": "...", "hashtags": ["#tag1", "#tag2"], "tags": ["tag1", "tag2"] }`;

        try {
            const response = await this.chat({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Title: ${title}\nTopic: ${topic}` },
                ],
                temperature: 0.7,
                max_tokens: 200,
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Failed to generate metadata:', error);
            return {
                description: `Join us for an exciting stream about ${topic}!`,
                hashtags: ['#livestream', '#aiavatar', `#${topic.replace(/\s+/g, '')}`],
                tags: ['livestream', 'ai', topic.toLowerCase()],
            };
        }
    }

    /**
     * Check if API is available
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.client.get('/models');
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Singleton instance
let openaiInstance: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
    if (!openaiInstance) {
        openaiInstance = new OpenAIService({
            apiKey: process.env.OPENAI_API_KEY || 'demo-key',
        });
    }
    return openaiInstance;
}
