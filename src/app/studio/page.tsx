'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { StudioHeader, StudioSidebar } from '@/components/studio/StudioLayout';
import { PreviewCanvas, StreamControls } from '@/components/studio/StreamControls';
import { AnalyticsDashboard } from '@/components/studio/Analytics';
import { AIControlPanel } from '@/components/studio/AIControlPanel';
import { useStudioStore } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { Scene, Stream, AIAvatar, ChatMessage } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Initialize with demo data
const demoScenes: Scene[] = [
    {
        id: 'scene-1',
        name: 'Main Scene',
        sources: [
            { id: 's1', type: 'avatar', name: 'AI Host', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, zIndex: 1, visible: true, locked: false, settings: {} },
        ],
        layout: 'single',
        transitionType: 'fade',
        transitionDuration: 300,
    },
    {
        id: 'scene-2',
        name: 'Interview',
        sources: [],
        layout: 'side-by-side',
        transitionType: 'slide',
        transitionDuration: 500,
    },
    {
        id: 'scene-3',
        name: 'Screen Share',
        sources: [],
        layout: 'pip',
        transitionType: 'fade',
        transitionDuration: 300,
    },
    {
        id: 'scene-4',
        name: 'BRB Screen',
        sources: [],
        layout: 'single',
        transitionType: 'fade',
        transitionDuration: 500,
    },
];

const demoStream: Stream = {
    id: 'stream-demo',
    title: 'AI Avatar Demo Stream',
    description: 'Testing the AI Avatar Livestream Platform',
    status: 'offline',
    startedAt: null,
    endedAt: null,
    viewerCount: 0,
    platforms: [
        { id: 'p1', name: 'youtube', status: 'connected', viewerCount: 0 },
        { id: 'p2', name: 'twitch', status: 'connected', viewerCount: 0 },
        { id: 'p3', name: 'facebook', status: 'connected', viewerCount: 0 },
    ],
    scenes: demoScenes,
    activeSceneId: 'scene-1',
};

const demoAvatar: AIAvatar = {
    id: 'avatar-1',
    name: 'Alex - Professional Host',
    provider: 'heygen',
    thumbnailUrl: '',
    voiceId: 'voice-1',
    status: 'idle',
    settings: {
        language: 'en-US',
        emotion: 'neutral',
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
    },
};

const demoChatMessages: ChatMessage[] = [
    { id: 'c1', platform: 'youtube', username: 'TechFan2024', message: 'This AI avatar is amazing! 🔥', timestamp: new Date(), highlighted: false },
    { id: 'c2', platform: 'twitch', username: 'StreamViewer', message: 'Love the quality!', timestamp: new Date(), highlighted: false },
    { id: 'c3', platform: 'youtube', username: 'AIEnthusiast', message: 'Can the avatar speak multiple languages?', timestamp: new Date(), highlighted: true },
    { id: 'c4', platform: 'facebook', username: 'LiveFan', message: 'First time here, this is cool!', timestamp: new Date(), highlighted: false },
];

import { RealTimeAnalytics } from '@/components/studio/RealTimeAnalytics';
import { GuestVideoGrid } from '@/components/studio/GuestManager';
import { streamApi, sceneApi, Stream as ApiStream } from '@/lib/api';

export default function StudioPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [streamId, setStreamId] = useState<string>('');
    const {
        setScenes,
        setActiveScene,
        setStream,
        setAvatars,
        setActiveAvatar,
        setAnalytics,
        stream,
        isStreaming
    } = useStudioStore();
    const { socket } = useSocket(streamId || undefined);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Initialize real data on mount
    useEffect(() => {
        if (status !== 'authenticated' || !session?.user?.id) return;

        const initStudio = async () => {
            try {
                // 1. Fetch user streams
                const response = await streamApi.getByUser(session.user.id);
                let activeStream: ApiStream;

                if (response.data && response.data.length > 0) {
                    activeStream = response.data[0];
                } else {
                    // 2. Create default stream if none exists
                    const createRes = await streamApi.create({
                        title: `${session.user.name || 'User'}'s Studio`,
                        description: 'AI-Powered Livestream Session',
                        platforms: [
                            { name: 'youtube', streamKey: 'demo-key' },
                            { name: 'twitch', streamKey: 'demo-key' },
                            { name: 'facebook', streamKey: 'demo-key' }
                        ],
                        quality: '1080p30'
                    });

                    if (createRes.data) {
                        activeStream = createRes.data.stream;
                    } else {
                        throw new Error('Failed to create stream');
                    }
                }

                setStreamId(activeStream.id);
                setStream(activeStream as any);

                // 3. Load scenes
                const scenesRes = await sceneApi.list(activeStream.id);
                if (scenesRes.data) {
                    setScenes(scenesRes.data as any);
                    const activeScene = scenesRes.data.find(s => s.isActive) || scenesRes.data[0];
                    if (activeScene) setActiveScene(activeScene as any);
                }

                // 4. Load avatars
                setAvatars([demoAvatar]);
                setActiveAvatar(demoAvatar);

            } catch (error) {
                console.error('Error initializing studio:', error);
            }
        };

        initStudio();
    }, [status, session, setStream, setScenes, setActiveScene, setAvatars, setActiveAvatar]);

    if (status === 'loading') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-surface-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium">Loading Studio...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="h-screen flex flex-col bg-surface-500 overflow-hidden">
            <StudioHeader />

            <div className="flex-1 flex overflow-hidden">
                <StudioSidebar />

                <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                        {/* Top Section - Preview & Controls */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                            <div className="xl:col-span-2 space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="aspect-video glass rounded-2xl overflow-hidden relative"
                                >
                                    <PreviewCanvas className="h-full w-full" />
                                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                                        <GuestVideoGrid className="max-w-[400px] pointer-events-auto" />
                                    </div>
                                </motion.div>
                                <StreamControls />
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="h-full"
                            >
                                <AIControlPanel streamId={streamId} />
                            </motion.div>
                        </div>

                        {/* Bottom Section - Analytics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <RealTimeAnalytics streamId={streamId} />
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
