'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Square,
    Radio,
    Maximize2,
    Volume2,
    VolumeX,
    Settings,
    Eye,
    EyeOff,
    Sparkles,
    Mic,
    Send
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';

interface PreviewCanvasProps {
    className?: string;
}

export function PreviewCanvas({ className }: PreviewCanvasProps) {
    const { activeScene, isStreaming, streamDuration, updateStreamDuration } = useStudioStore();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Update stream duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isStreaming) {
            interval = setInterval(() => {
                updateStreamDuration(streamDuration + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isStreaming, streamDuration, updateStreamDuration]);

    return (
        <div className={cn('relative rounded-2xl overflow-hidden', className)}>
            {/* Preview Area */}
            <div className="aspect-video bg-surface-400 relative">
                {/* Scene Preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {activeScene ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full bg-gradient-to-br from-surface-300 via-surface-400 to-surface-500 flex items-center justify-center"
                        >
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center backdrop-blur-xl">
                                    <Sparkles size={48} className="text-accent-cyan" />
                                </div>
                                <h3 className="text-xl font-semibold mb-1">{activeScene.name}</h3>
                                <p className="text-gray-400 text-sm">{activeScene.sources.length} sources configured</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Eye size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No scene selected</p>
                            <p className="text-sm">Select a scene to preview</p>
                        </div>
                    )}
                </div>

                {/* Live Overlay */}
                <AnimatePresence>
                    {isStreaming && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-4 left-4 flex items-center gap-3"
                        >
                            <div className="live-indicator px-3 py-1.5 rounded-lg bg-red-500/90 text-white font-bold text-sm backdrop-blur-sm">
                                LIVE
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-black/50 text-white font-mono text-sm backdrop-blur-sm">
                                {formatDuration(streamDuration)}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Preview Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-2 rounded-lg bg-black/40 hover:bg-black/60 transition-colors"
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-2 rounded-lg bg-black/40 hover:bg-black/60 transition-colors"
                            >
                                <Maximize2 size={18} />
                            </button>
                            <button className="p-2 rounded-lg bg-black/40 hover:bg-black/60 transition-colors">
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StreamControlsProps {
    className?: string;
}

export function StreamControls({ className }: StreamControlsProps) {
    const { isStreaming, startStream, stopStream, stream } = useStudioStore();
    const [isStarting, setIsStarting] = useState(false);

    const handleToggleStream = async () => {
        if (isStreaming) {
            stopStream();
        } else {
            setIsStarting(true);
            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            startStream();
            setIsStarting(false);
        }
    };

    return (
        <div className={cn('flex items-center justify-center gap-4 py-4', className)}>
            {/* Stream Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleStream}
                disabled={isStarting}
                className={cn(
                    'relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3',
                    isStreaming
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                        : 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-neon-cyan hover:shadow-neon-purple',
                    isStarting && 'opacity-70 cursor-wait'
                )}
            >
                <AnimatePresence mode="wait">
                    {isStarting ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        />
                    ) : isStreaming ? (
                        <motion.div
                            key="stop"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Square size={24} fill="currentColor" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Radio size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <span>
                    {isStarting ? 'Connecting...' : isStreaming ? 'End Stream' : 'Go Live'}
                </span>
            </motion.button>

            {/* Platform Status */}
            {stream && stream.platforms.length > 0 && (
                <div className="flex items-center gap-2">
                    {stream.platforms.map((platform) => (
                        <div
                            key={platform.id}
                            className={cn(
                                'px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2',
                                platform.status === 'streaming'
                                    ? 'bg-green-500/20 text-green-400'
                                    : platform.status === 'connected'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-gray-500/20 text-gray-400'
                            )}
                        >
                            <span className={cn(
                                'w-2 h-2 rounded-full',
                                platform.status === 'streaming' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                            )} />
                            <span className="capitalize">{platform.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

interface AvatarControlsProps {
    className?: string;
}

export function AvatarControls({ className }: AvatarControlsProps) {
    const { activeAvatar, speakWithAvatar } = useStudioStore();
    const [text, setText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = () => {
        if (!text.trim() || !activeAvatar) return;

        setIsSpeaking(true);
        speakWithAvatar(text);

        // Simulate speech duration
        setTimeout(() => {
            setIsSpeaking(false);
            setText('');
        }, text.length * 50);
    };

    return (
        <div className={cn('glass rounded-2xl p-4', className)}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center">
                    <Sparkles size={24} className="text-accent-cyan" />
                </div>
                <div>
                    <h3 className="font-semibold">AI Avatar</h3>
                    <p className="text-xs text-gray-400">
                        {activeAvatar ? activeAvatar.name : 'No avatar selected'}
                    </p>
                </div>

                {activeAvatar && (
                    <div className={cn(
                        'ml-auto px-3 py-1 rounded-full text-xs font-medium',
                        activeAvatar.status === 'speaking'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                    )}>
                        {activeAvatar.status === 'speaking' ? 'Speaking...' : 'Idle'}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSpeak()}
                    placeholder="Type text for avatar to speak..."
                    className="input-field flex-1"
                    disabled={!activeAvatar || isSpeaking}
                />
                <button
                    onClick={handleSpeak}
                    disabled={!text.trim() || !activeAvatar || isSpeaking}
                    className={cn(
                        'px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2',
                        text.trim() && activeAvatar && !isSpeaking
                            ? 'bg-accent-cyan text-white hover:bg-accent-cyan/80'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    )}
                >
                    {isSpeaking ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
        </div>
    );
}
