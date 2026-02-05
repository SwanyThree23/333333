/**
 * API Client for AI Avatar Livestream Platform
 * Provides typed access to all backend endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { error: errorData.error || 'Request failed' };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============================================
// Stream API
// ============================================

export interface CreateStreamRequest {
    title: string;
    description?: string;
    platforms?: Array<{
        name: 'youtube' | 'twitch' | 'facebook' | 'tiktok' | 'custom';
        streamKey: string;
        rtmpUrl?: string;
    }>;
    quality?: '720p30' | '720p60' | '1080p30' | '1080p60' | '4k30';
}

export interface Stream {
    id: string;
    title: string;
    description: string;
    status: string;
    startedAt?: string;
    endedAt?: string;
    platforms: string[];
}

export const streamApi = {
    create: (data: CreateStreamRequest) =>
        apiCall<{ success: boolean; stream: Stream }>('/streams', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    get: (id: string) => apiCall<Stream>(`/streams/${id}`),

    getByUser: (userId: string) => apiCall<Stream[]>(`/streams/user/${userId}`),

    start: (id: string) =>
        apiCall<{ success: boolean; errors: string[] }>(`/streams/${id}/start`, {
            method: 'POST',
        }),

    stop: (id: string) =>
        apiCall<{ success: boolean }>(`/streams/${id}/stop`, {
            method: 'POST',
        }),
};

// ============================================
// Avatar API
// ============================================

export interface Avatar {
    avatar_id: string;
    avatar_name: string;
    gender: string;
    preview_image_url: string;
    preview_video_url: string;
}

export interface Voice {
    voice_id: string;
    name: string;
    language?: string;
    gender: string;
    preview_audio?: string;
    category?: string;
}

export interface AvatarSession {
    session_id: string;
    sdp: string;
    ice_servers: Array<{ urls: string[] }>;
}

export const avatarApi = {
    list: () => apiCall<Avatar[]>('/avatars'),

    listVoices: () =>
        apiCall<{ heygen: Voice[]; elevenlabs: Voice[] }>('/voices'),

    createSession: (avatarId: string, streamId: string) =>
        apiCall<{ success: boolean; session: AvatarSession }>('/avatar/session', {
            method: 'POST',
            body: JSON.stringify({ avatarId, streamId }),
        }),

    startSession: (sessionId: string, sdpAnswer: string) =>
        apiCall<{ success: boolean }>('/avatar/session/start', {
            method: 'POST',
            body: JSON.stringify({ sessionId, sdpAnswer }),
        }),

    speak: (params: {
        sessionId: string;
        streamId: string;
        text: string;
        voiceId?: string;
        useElevenLabs?: boolean;
    }) =>
        apiCall<{ success: boolean; duration: number }>('/avatar/speak', {
            method: 'POST',
            body: JSON.stringify(params),
        }),

    stop: (sessionId: string, streamId: string) =>
        apiCall<{ success: boolean }>('/avatar/stop', {
            method: 'POST',
            body: JSON.stringify({ sessionId, streamId }),
        }),
};

// ============================================
// AI Features API
// ============================================

export interface ModerationResult {
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
}

export interface SceneSuggestion {
    name: string;
    description: string;
    layout: string;
    sources: string[];
    confidence: number;
}

export const aiApi = {
    moderate: (text: string) =>
        apiCall<ModerationResult>('/ai/moderate', {
            method: 'POST',
            body: JSON.stringify({ text }),
        }),

    generateScript: (topic: string, style?: string, duration?: number) =>
        apiCall<{ script: string }>('/ai/generate-script', {
            method: 'POST',
            body: JSON.stringify({ topic, style, duration }),
        }),

    suggestScene: (
        currentScene: string,
        chatHistory: string[],
        availableScenes: string[]
    ) =>
        apiCall<SceneSuggestion>('/ai/suggest-scene', {
            method: 'POST',
            body: JSON.stringify({ currentScene, chatHistory, availableScenes }),
        }),

    getChatResponse: (
        question: string,
        streamTopic: string,
        previousResponses?: string[]
    ) =>
        apiCall<{ response: string }>('/ai/chat-response', {
            method: 'POST',
            body: JSON.stringify({ question, streamTopic, previousResponses }),
        }),

    generateMetadata: (title: string, topic: string) =>
        apiCall<{ description: string; hashtags: string[]; tags: string[] }>(
            '/ai/generate-metadata',
            {
                method: 'POST',
                body: JSON.stringify({ title, topic }),
            }
        ),
};

// ============================================
// Guest API
// ============================================

export interface Guest {
    id: string;
    name: string;
    email: string;
    inviteCode: string;
    status: 'invited' | 'waiting' | 'connected' | 'disconnected';
    joinedAt?: string;
}

export const guestApi = {
    create: (streamId: string, name: string, email: string) =>
        apiCall<{ success: boolean; guest: Guest }>('/guests', {
            method: 'POST',
            body: JSON.stringify({ streamId, name, email }),
        }),

    list: (streamId: string) => apiCall<Guest[]>(`/guests/${streamId}`),

    join: (inviteCode: string) =>
        apiCall<{ success: boolean; guest: Guest }>(`/guests/join/${inviteCode}`, {
            method: 'POST',
        }),
};

// ============================================
// Scene API
// ============================================

export interface Scene {
    id: string;
    streamId: string;
    name: string;
    layout: string;
    sources: Record<string, unknown>[];
    order: number;
    isActive: boolean;
}

export const sceneApi = {
    list: (streamId: string) => apiCall<Scene[]>(`/scenes/${streamId}`),

    create: (data: Partial<Scene>) =>
        apiCall<{ success: boolean; scene: Scene }>('/scenes', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    activate: (streamId: string, sceneId: string) =>
        apiCall<{ success: boolean }>(`/scenes/${streamId}/activate/${sceneId}`, {
            method: 'POST',
        }),
};

// ============================================
// Analytics API
// ============================================

export interface Analytics {
    streamId: string;
    totalViewers: number;
    peakViewers: number;
    chatMessages: number;
    reactions: number;
    shares: number;
    newFollowers: number;
    platformBreakdown: Record<string, number>;
}

export const analyticsApi = {
    get: (streamId: string) => apiCall<Analytics>(`/analytics/${streamId}`),
};

// ============================================
// Health API
// ============================================

export const healthApi = {
    check: () =>
        apiCall<{
            status: string;
            timestamp: string;
            services: Record<string, unknown>;
        }>('/health'),
};
// ============================================
// Auth API
// ============================================

export const authApi = {
    register: (data: any) =>
        apiCall<{ success: boolean; user: any }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
