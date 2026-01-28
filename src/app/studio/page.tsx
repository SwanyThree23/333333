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

export default function StudioPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [streamId] = useState('stream-demo');
    const { socket, startStream, stopStream } = useSocket(streamId);

    const {
        setScenes,
        setActiveScene,
        setStream,
        setAvatars,
        setActiveAvatar,
        addChatMessage,
        setAnalytics,
        stream,
        isStreaming
    } = useStudioStore();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Initialize demo data on mount
    useEffect(() => {
        if (status !== 'authenticated') return;

        setScenes(demoScenes);
        setActiveScene(demoScenes[0]);
        setStream(demoStream);
        setAvatars([demoAvatar]);
        setActiveAvatar(demoAvatar);

        // Add demo chat messages
        demoChatMessages.forEach((msg) => addChatMessage(msg));

        // Set demo analytics
        setAnalytics({
            totalViewers: 1234,
            peakViewers: 1567,
            averageWatchTime: 542,
            chatMessages: 342,
            reactions: 892,
            shares: 56,
            newFollowers: 23,
            platformBreakdown: [
                { platform: 'youtube', viewers: 756, percentage: 61 },
                { platform: 'twitch', viewers: 328, percentage: 27 },
                { platform: 'facebook', viewers: 150, percentage: 12 },
            ],
            viewerTimeline: [],
        });

        // Simulate incoming chat messages
        const chatInterval = setInterval(() => {
            const platforms = ['youtube', 'twitch', 'facebook'];
            const usernames = ['Viewer123', 'StreamFan', 'AILover', 'TechGuru', 'CoolDude', 'NewFollower', 'HappyWatcher'];
            const messages = [
                'Great stream! 🎉',
                'Hello from the chat!',
                'This is so cool!',
                'How does this work?',
                'Amazing quality!',
                'Love the AI avatar!',
                '👏👏👏',
                'Just subscribed!',
                'The future is here!',
                'Mind blown 🤯',
            ];

            addChatMessage({
                id: `chat-${Date.now()}`,
                platform: platforms[Math.floor(Math.random() * platforms.length)],
                username: usernames[Math.floor(Math.random() * usernames.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                timestamp: new Date(),
                highlighted: Math.random() > 0.9,
            });
        }, 4000);

        // Simulate viewer count changes when streaming
        const viewerInterval = setInterval(() => {
            if (isStreaming && stream) {
                const change = Math.floor(Math.random() * 100) - 30;
                const newCount = Math.max(0, (stream.viewerCount || 0) + change);
                setStream({
                    ...stream,
                    viewerCount: newCount,
                });
            }
        }, 3000);

        return () => {
            clearInterval(chatInterval);
            clearInterval(viewerInterval);
        };
    }, [status]);

    // Update viewer count when streaming
    useEffect(() => {
        if (isStreaming && stream) {
            const interval = setInterval(() => {
                const change = Math.floor(Math.random() * 50) - 15;
                const newCount = Math.max(100, (stream.viewerCount || 0) + change);
                setStream({
                    ...stream,
                    viewerCount: newCount,
                });
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [isStreaming]);

    if (status === 'loading') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-surface-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium">Loading Studio...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="h-screen flex flex-col bg-surface-500 overflow-hidden">
            {/* Header */}
            <StudioHeader />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <StudioSidebar />

                {/* Main Studio Area */}
                <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 overflow-y-auto">
                    {/* Top Section - Preview & Controls */}
                    <div className="flex-1 min-h-[400px]">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full glass rounded-2xl overflow-hidden flex flex-col"
                        >
                            <PreviewCanvas className="flex-1" />
                            <StreamControls />
                        </motion.div>
                    </div>

                    {/* Bottom Section - AI Controls & Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <AIControlPanel streamId={streamId} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <AnalyticsDashboard />
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
