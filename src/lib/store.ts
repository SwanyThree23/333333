import { create } from 'zustand';
import { Stream, Scene, AIAvatar, ChatMessage, Guest, StreamAnalytics } from '@/types';

interface StudioState {
    // Stream State
    stream: Stream | null;
    isStreaming: boolean;
    streamDuration: number;

    // Scene State
    scenes: Scene[];
    activeScene: Scene | null;
    previewScene: Scene | null;
    isTransitioning: boolean;
    setIsTransitioning: (isTransitioning: boolean) => void;

    // Avatar State
    avatars: AIAvatar[];
    activeAvatar: AIAvatar | null;
    avatarSessionId: string | null;

    // Chat State
    chatMessages: ChatMessage[];
    chatPaused: boolean;

    // Guest State
    guests: Guest[];

    // Analytics
    analytics: StreamAnalytics | null;

    // UI State
    sidebarOpen: boolean;
    activePanel: 'scenes' | 'layout' | 'sources' | 'chat' | 'guests' | 'settings';
    aiDirectorEnabled: boolean;
    directorLogs: { id: string; timestamp: Date; message: string; type: 'info' | 'success' | 'warning' }[];
    aiInsights: string | null;
    aiLatency: number;
    aiConfidence: number;

    // Actions
    setAiDirectorEnabled: (enabled: boolean) => void;
    addDirectorLog: (log: { message: string; type: 'info' | 'success' | 'warning' }) => void;
    setDirectorLogs: (logs: { id: string; timestamp: Date; message: string; type: 'info' | 'success' | 'warning' }[]) => void;
    setAiInsights: (insights: string | null) => void;
    setAiMetrics: (latency: number, confidence: number) => void;
    setStream: (stream: Stream | null) => void;
    startStream: () => void;
    stopStream: () => void;
    updateStreamDuration: (duration: number) => void;

    setScenes: (scenes: Scene[]) => void;
    addScene: (scene: Scene) => void;
    removeScene: (sceneId: string) => void;
    setActiveScene: (scene: Scene | null) => void;
    setPreviewScene: (scene: Scene | null) => void;

    setAvatars: (avatars: AIAvatar[]) => void;
    setActiveAvatar: (avatar: AIAvatar | null) => void;
    setAvatarSessionId: (id: string | null) => void;
    speakWithAvatar: (text: string) => void;

    addChatMessage: (message: ChatMessage) => void;
    clearChat: () => void;
    toggleChatPause: () => void;

    addGuest: (guest: Guest) => void;
    removeGuest: (guestId: string) => void;
    updateGuestStatus: (guestId: string, status: Guest['status']) => void;

    setAnalytics: (analytics: StreamAnalytics | null) => void;

    toggleSidebar: () => void;
    setActivePanel: (panel: StudioState['activePanel']) => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
    // Initial State
    stream: null,
    isStreaming: false,
    streamDuration: 0,

    scenes: [],
    activeScene: null,
    previewScene: null,
    isTransitioning: false,

    avatars: [],
    activeAvatar: null,
    avatarSessionId: null,

    chatMessages: [],
    chatPaused: false,

    guests: [],

    analytics: null,

    sidebarOpen: true,
    activePanel: 'scenes',
    aiDirectorEnabled: false,
    directorLogs: [],
    aiInsights: null,
    aiLatency: 0,
    aiConfidence: 0,

    // Actions
    setAiDirectorEnabled: (enabled) => set({ aiDirectorEnabled: enabled }),
    addDirectorLog: (log) => set((state) => ({
        directorLogs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date() }, ...state.directorLogs].slice(0, 50)
    })),
    setDirectorLogs: (logs) => set({ directorLogs: logs }),
    setAiInsights: (insights) => set({ aiInsights: insights }),
    setAiMetrics: (latency, confidence) => set({ aiLatency: latency, aiConfidence: confidence }),
    setStream: (stream) => set({ stream }),

    startStream: () => set({
        isStreaming: true,
        stream: get().stream ? {
            ...get().stream!,
            status: 'live',
            startedAt: new Date(),
        } : null
    }),

    stopStream: () => set({
        isStreaming: false,
        streamDuration: 0,
        stream: get().stream ? {
            ...get().stream!,
            status: 'ended',
            endedAt: new Date(),
        } : null
    }),

    updateStreamDuration: (duration) => set({ streamDuration: duration }),

    // Scene Actions
    setScenes: (scenes) => set({ scenes }),

    addScene: (scene) => set((state) => ({
        scenes: [...state.scenes, scene]
    })),

    removeScene: (sceneId) => set((state) => ({
        scenes: state.scenes.filter((s) => s.id !== sceneId),
        activeScene: state.activeScene?.id === sceneId ? null : state.activeScene,
    })),

    setActiveScene: (scene) => set({ activeScene: scene }),
    setPreviewScene: (scene) => set({ previewScene: scene }),
    setIsTransitioning: (isTransitioning) => set({ isTransitioning }),

    // Avatar Actions
    setAvatars: (avatars) => set({ avatars }),
    setActiveAvatar: (avatar) => set({ activeAvatar: avatar }),
    setAvatarSessionId: (id) => set({ avatarSessionId: id }),

    speakWithAvatar: (text) => {
        const avatar = get().activeAvatar;
        if (avatar) {
            set({
                activeAvatar: { ...avatar, status: 'speaking' }
            });
            // Reset after simulated speech duration
            setTimeout(() => {
                set({
                    activeAvatar: { ...avatar, status: 'idle' }
                });
            }, text.length * 50);
        }
    },

    // Chat Actions
    addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages.slice(-99), message]
    })),

    clearChat: () => set({ chatMessages: [] }),
    toggleChatPause: () => set((state) => ({ chatPaused: !state.chatPaused })),

    // Guest Actions
    addGuest: (guest) => set((state) => ({
        guests: [...state.guests, guest]
    })),

    removeGuest: (guestId) => set((state) => ({
        guests: state.guests.filter((g) => g.id !== guestId)
    })),

    updateGuestStatus: (guestId, status) => set((state) => ({
        guests: state.guests.map((g) =>
            g.id === guestId ? { ...g, status } : g
        )
    })),

    // Analytics Actions
    setAnalytics: (analytics) => set({ analytics }),

    // UI Actions
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setActivePanel: (panel) => set({ activePanel: panel }),
}));
