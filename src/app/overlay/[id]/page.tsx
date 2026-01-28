'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/socket';
import { useStudioStore } from '@/lib/store';
import { ChatOverlay } from '@/components/overlay/ChatOverlay';
import { AlertOverlay } from '@/components/overlay/AlertOverlay';
import { WebRTCAvatar } from '@/components/studio/WebRTCAvatar';
import { GuestVideoGrid } from '@/components/studio/GuestManager';
import { Scene, ChatMessage } from '@/types';

export default function StreamOverlayPage() {
    const { id } = useParams();
    const streamId = id as string;
    const { socket, sendIceCandidate } = useSocket(streamId);
    const { activeScene, activeAvatar, setActiveScene, scenes, setScenes, guests } = useStudioStore();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streamData, setStreamData] = useState<any>(null);

    // 1. Fetch stream and scenes data initially
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [streamRes, scenesRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/streams/${streamId}`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scenes/${streamId}`)
                ]);

                const stream = await streamRes.json();
                const fetchedScenes = await scenesRes.json();

                setStreamData(stream);
                setScenes(fetchedScenes);

                // Set initial active scene
                const active = fetchedScenes.find((s: Scene) => s.id === stream.activeSceneId) || fetchedScenes[0];
                if (active) setActiveScene(active);
            } catch (err) {
                console.error("Failed to fetch overlay data:", err);
            }
        };

        if (streamId) fetchData();
    }, [streamId, setScenes, setActiveScene]);

    // 2. Specialized Chat Listener for Overlay
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg: ChatMessage) => {
            setMessages(prev => [...prev.slice(-19), msg]);

            // Check for potential donation alert
            if (msg.donation) {
                window.dispatchEvent(new CustomEvent('stream-alert', {
                    detail: {
                        type: 'donation',
                        user: msg.username,
                        amount: `${msg.donation.currency}${msg.donation.amount}`,
                        message: msg.message
                    }
                }));
            }
        };

        socket.on('chat:message', handleMessage);
        return () => {
            socket.off('chat:message', handleMessage);
        };
    }, [socket]);

    // 3. Define transition variants mapping
    const transitionVariants = {
        fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.5 } },
        slide: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '-100%' }, transition: { type: 'spring', damping: 25 } },
        zoom: { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 }, transition: { duration: 0.6 } },
        cut: { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    };

    const currentTransition = activeScene?.transitionType || 'fade';
    const variants = transitionVariants[currentTransition as keyof typeof transitionVariants];

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
            {/* Main Stage (Scene Rendering) */}
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    {activeScene ? (
                        <motion.div
                            key={activeScene.id}
                            {...variants}
                            className="w-full h-full relative"
                        >
                            {/* Render AI Avatar if active */}
                            {activeAvatar && (
                                <WebRTCAvatar
                                    avatarId={activeAvatar.id}
                                    streamId={streamId}
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {/* Render Guests Grid - Floating or Layout based */}
                            <div className="absolute bottom-10 right-10 w-[400px]">
                                <GuestVideoGrid streamId={streamId} className="max-w-full" />
                            </div>

                            {/* Scene Content Sources (Static Images/Videos/Text etc) */}
                            {activeScene.sources.filter(s => s.visible).map(source => (
                                <motion.div
                                    key={source.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute overflow-hidden"
                                    style={{
                                        left: `${source.position.x}%`,
                                        top: `${source.position.y}%`,
                                        width: `${source.size.width}px`,
                                        height: `${source.size.height}px`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: source.zIndex
                                    }}
                                >
                                    {source.type === 'text' && (
                                        <div className="text-white text-2xl font-bold bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                                            {source.name}
                                        </div>
                                    )}
                                    {source.type === 'image' && typeof source.settings.url === 'string' && (
                                        <img src={source.settings.url} alt="" className="w-full h-full object-contain" />
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                            <h1 className="text-4xl font-black tracking-widest italic opacity-10">
                                WAITING FOR STREAM
                            </h1>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Overlays (Static, not affected by scene transitions) */}
            <div className="absolute inset-0 pointer-events-none z-50">
                {/* Chat Overlay */}
                <ChatOverlay
                    messages={messages}
                    className="absolute bottom-10 left-10"
                />

                {/* Alerts Overlay */}
                <AlertOverlay />

                {/* Stream Info (Optional) */}
                <div className="absolute top-10 right-10 flex flex-col items-end">
                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white font-bold text-sm">LIVE</span>
                        <div className="w-px h-3 bg-white/20" />
                        <span className="text-gray-300 text-xs uppercase tracking-wider font-medium">
                            {streamData?.title || 'SwanyThree Pro Stream'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Cinematic Borders / Effects */}
            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10 z-10" />
        </div>
    );
}
