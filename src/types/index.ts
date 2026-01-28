// Stream Types
export interface Stream {
    id: string;
    title: string;
    description: string;
    status: 'offline' | 'preparing' | 'live' | 'ended';
    startedAt: Date | null;
    endedAt: Date | null;
    viewerCount: number;
    platforms: StreamPlatform[];
    scenes: Scene[];
    activeSceneId: string | null;
}

export interface StreamPlatform {
    id: string;
    name: 'youtube' | 'twitch' | 'facebook' | 'tiktok' | 'custom';
    status: 'connected' | 'disconnected' | 'streaming';
    rtmpUrl?: string;
    streamKey?: string;
    viewerCount: number;
}

// Scene Types
export interface Scene {
    id: string;
    name: string;
    thumbnail?: string;
    sources: SceneSource[];
    layout: SceneLayout;
    transitionType: 'cut' | 'fade' | 'slide' | 'zoom';
    transitionDuration: number;
}

export interface SceneSource {
    id: string;
    type: 'avatar' | 'camera' | 'screen' | 'image' | 'video' | 'browser' | 'text';
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    visible: boolean;
    locked: boolean;
    settings: Record<string, unknown>;
}

export type SceneLayout = 'single' | 'side-by-side' | 'pip' | 'grid' | 'custom';

// Avatar Types
export interface AIAvatar {
    id: string;
    name: string;
    provider: 'heygen' | 'did' | 'synthesia' | 'custom';
    thumbnailUrl: string;
    voiceId: string;
    status: 'idle' | 'speaking' | 'processing' | 'error';
    settings: AvatarSettings;
}

export interface AvatarSettings {
    language: string;
    emotion: 'neutral' | 'happy' | 'serious' | 'energetic';
    speed: number;
    pitch: number;
    volume: number;
}

// Chat Types
export interface ChatMessage {
    id: string;
    platform: string;
    username: string;
    userAvatar?: string;
    message: string;
    timestamp: Date;
    badges?: string[];
    highlighted: boolean;
    donation?: {
        amount: number;
        currency: string;
    };
}

// Guest Types
export interface Guest {
    id: string;
    name: string;
    email?: string;
    status: 'invited' | 'waiting' | 'connected' | 'disconnected';
    videoEnabled: boolean;
    audioEnabled: boolean;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

// Analytics Types
export interface StreamAnalytics {
    totalViewers: number;
    peakViewers: number;
    averageWatchTime: number;
    chatMessages: number;
    reactions: number;
    shares: number;
    newFollowers: number;
    platformBreakdown: {
        platform: string;
        viewers: number;
        percentage: number;
    }[];
    viewerTimeline: {
        timestamp: Date;
        count: number;
    }[];
}

// WebSocket Event Types
export interface WSMessage {
    type: string;
    payload: unknown;
    timestamp: number;
}

export type WSEventType =
    | 'stream:start'
    | 'stream:stop'
    | 'scene:switch'
    | 'avatar:speak'
    | 'chat:message'
    | 'guest:join'
    | 'guest:leave'
    | 'analytics:update';
