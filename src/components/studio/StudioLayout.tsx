'use client';

import { motion } from 'framer-motion';
import {
    Radio,
    Users,
    Eye,
    Clock,
    Settings,
    MonitorPlay,
    Mic,
    MicOff,
    Video,
    VideoOff,
    MessageSquare,
    UserPlus,
    Layers,
    LayoutGrid,
    Sparkles,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn, formatDuration, formatNumber } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';

interface HeaderProps {
    className?: string;
}

export function StudioHeader({ className }: HeaderProps) {
    const { stream, isStreaming, streamDuration, toggleSidebar, sidebarOpen } = useStudioStore();

    return (
        <header className={cn(
            'h-16 glass border-b border-white/10 flex items-center justify-between px-6',
            className
        )}>
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-burgundy to-accent-gold flex items-center justify-center">
                        <MonitorPlay size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">
                            {stream?.title || 'AI Avatar Studio'}
                        </h1>
                        <p className="text-xs text-gray-400">
                            {isStreaming ? 'Broadcasting Live' : 'Offline'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Center Section - Live Status */}
            <div className="flex items-center gap-6">
                {isStreaming && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4"
                    >
                        <div className="live-indicator px-4 py-2 rounded-full bg-red-500/20 text-red-400 font-semibold text-sm">
                            LIVE
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                            <Clock size={16} />
                            <span className="font-mono">{formatDuration(streamDuration)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                            <Eye size={16} />
                            <span>{formatNumber(stream?.viewerCount || 0)}</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Right Section - Controls */}
            <div className="flex items-center gap-3">
                <QuickControlButton icon={<Mic size={18} />} active />
                <QuickControlButton icon={<Video size={18} />} active />
                <QuickControlButton icon={<MessageSquare size={18} />} />
                <QuickControlButton icon={<UserPlus size={18} />} />

                <div className="w-px h-8 bg-white/10 mx-2" />

                <button
                    className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                    title="Studio Settings"
                    aria-label="Studio Settings"
                >
                    <Settings size={20} className="text-gray-400" />
                </button>
            </div>
        </header>
    );
}

function QuickControlButton({
    icon,
    active = false
}: {
    icon: React.ReactNode;
    active?: boolean;
}) {
    return (
        <button className={cn(
            'p-2.5 rounded-xl transition-all duration-200',
            active
                ? 'bg-accent-gold/20 text-accent-gold'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
        )}>
            {icon}
        </button>
    );
}

interface SidebarProps {
    className?: string;
}

import { SceneSwitcher, SceneLayoutEditor } from './SceneLayoutEditor';
import { ChatPanel as AdvancedChatPanel } from './ChatPanel';
import { GuestManager } from './GuestManager';

export function StudioSidebar({ className }: SidebarProps) {
    const {
        sidebarOpen,
        activePanel,
        setActivePanel,
        scenes,
        activeScene,
        chatMessages,
        guests,
        stream
    } = useStudioStore();

    if (!sidebarOpen) return null;

    const panels = [
        { id: 'scenes' as const, icon: <Layers size={20} />, label: 'Scenes', count: scenes.length },
        { id: 'layout' as const, icon: <LayoutGrid size={20} />, label: 'Layout', count: activeScene?.sources.length || 0 },
        { id: 'chat' as const, icon: <MessageSquare size={20} />, label: 'Chat', count: chatMessages.length },
        { id: 'guests' as const, icon: <Users size={20} />, label: 'Guests', count: guests.length },
        { id: 'settings' as const, icon: <Settings size={20} />, label: 'Settings' },
    ];

    const streamId = stream?.id || '';

    return (
        <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
                'h-full glass-dark border-r border-white/10 flex flex-col',
                className
            )}
        >
            {/* Panel Tabs */}
            <div className="flex border-b border-white/10">
                {panels.map((panel) => (
                    <button
                        key={panel.id}
                        onClick={() => setActivePanel(panel.id as any)}
                        className={cn(
                            'flex-1 py-3 px-2 flex flex-col items-center gap-1 transition-all duration-200 relative',
                            activePanel === panel.id
                                ? 'text-accent-gold'
                                : 'text-gray-400 hover:text-white'
                        )}
                        title={panel.label}
                    >
                        {panel.icon}
                        <span className="text-[10px] font-medium">{panel.label}</span>
                        {panel.count !== undefined && panel.count > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-burgundy text-[10px] flex items-center justify-center text-white">
                                {panel.count > 99 ? '99+' : panel.count}
                            </span>
                        )}
                        {activePanel === panel.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activePanel === 'scenes' && <SceneSwitcher />}
                {activePanel === 'layout' && <SceneLayoutEditor />}
                {activePanel === 'chat' && <AdvancedChatPanel streamId={streamId} />}
                {activePanel === 'guests' && <GuestManager streamId={streamId} />}
                {activePanel === 'settings' && <SettingsPanel />}
            </div>
        </motion.aside>
    );
}

function SettingsPanel() {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <Settings size={20} className="text-accent-gold" />
                Stream Settings
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">Stream Title</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Enter stream title..."
                        defaultValue="AI Avatar Livestream Studio"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">Description</label>
                    <textarea
                        className="input-field min-h-[100px] resize-none"
                        placeholder="Enter description..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">Stream Quality</label>
                    <select className="input-field" title="Stream Quality">
                        <option>1080p 60fps (Recommended)</option>
                        <option>1080p 30fps</option>
                        <option>720p 60fps</option>
                        <option>720p 30fps</option>
                        <option>480p 30fps (Low Latency)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">Latency Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="px-3 py-2 rounded-lg bg-accent-gold/20 border border-accent-gold/50 text-accent-gold text-xs font-semibold">
                            Ultra Low
                        </button>
                        <button className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/10 transition-colors">
                            Standard
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <button className="w-full py-3 rounded-xl bg-accent-burgundy text-white font-bold hover:bg-accent-burgundy/80 transition-all shadow-neon-burgundy">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
