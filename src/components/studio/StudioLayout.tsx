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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
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

                <button className="p-2.5 rounded-xl hover:bg-white/10 transition-colors">
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
                ? 'bg-accent-cyan/20 text-accent-cyan'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
        )}>
            {icon}
        </button>
    );
}

interface SidebarProps {
    className?: string;
}

export function StudioSidebar({ className }: SidebarProps) {
    const {
        sidebarOpen,
        activePanel,
        setActivePanel,
        scenes,
        activeScene,
        chatMessages,
        guests
    } = useStudioStore();

    if (!sidebarOpen) return null;

    const panels = [
        { id: 'scenes' as const, icon: <Layers size={20} />, label: 'Scenes', count: scenes.length },
        { id: 'sources' as const, icon: <MonitorPlay size={20} />, label: 'Sources', count: activeScene?.sources.length || 0 },
        { id: 'chat' as const, icon: <MessageSquare size={20} />, label: 'Chat', count: chatMessages.length },
        { id: 'guests' as const, icon: <Users size={20} />, label: 'Guests', count: guests.length },
        { id: 'settings' as const, icon: <Settings size={20} />, label: 'Settings' },
    ];

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
                        onClick={() => setActivePanel(panel.id)}
                        className={cn(
                            'flex-1 py-3 px-2 flex flex-col items-center gap-1 transition-all duration-200 relative',
                            activePanel === panel.id
                                ? 'text-accent-cyan'
                                : 'text-gray-400 hover:text-white'
                        )}
                    >
                        {panel.icon}
                        <span className="text-[10px] font-medium">{panel.label}</span>
                        {panel.count !== undefined && panel.count > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-purple text-[10px] flex items-center justify-center">
                                {panel.count > 99 ? '99+' : panel.count}
                            </span>
                        )}
                        {activePanel === panel.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activePanel === 'scenes' && <ScenesPanel />}
                {activePanel === 'sources' && <SourcesPanel />}
                {activePanel === 'chat' && <ChatPanel />}
                {activePanel === 'guests' && <GuestsPanel />}
                {activePanel === 'settings' && <SettingsPanel />}
            </div>
        </motion.aside>
    );
}

function ScenesPanel() {
    const { scenes, activeScene, setActiveScene, addScene } = useStudioStore();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Scenes</h3>
                <button
                    onClick={() => addScene({
                        id: crypto.randomUUID(),
                        name: `Scene ${scenes.length + 1}`,
                        sources: [],
                        layout: 'single',
                        transitionType: 'fade',
                        transitionDuration: 300,
                    })}
                    className="text-xs px-3 py-1.5 rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors"
                >
                    + Add
                </button>
            </div>

            <div className="grid gap-3">
                {scenes.map((scene) => (
                    <motion.button
                        key={scene.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveScene(scene)}
                        className={cn(
                            'w-full p-3 rounded-xl transition-all duration-200 text-left',
                            activeScene?.id === scene.id
                                ? 'bg-accent-cyan/20 border border-accent-cyan/50'
                                : 'bg-white/5 border border-transparent hover:bg-white/10'
                        )}
                    >
                        <div className="aspect-video bg-surface-400 rounded-lg mb-2 flex items-center justify-center">
                            <Layers size={24} className="text-gray-500" />
                        </div>
                        <p className="font-medium text-sm">{scene.name}</p>
                        <p className="text-xs text-gray-400">{scene.sources.length} sources</p>
                    </motion.button>
                ))}

                {scenes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <Layers size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No scenes yet</p>
                        <p className="text-xs">Create your first scene</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SourcesPanel() {
    const { activeScene } = useStudioStore();

    const sourceTypes = [
        { type: 'avatar', icon: <Sparkles size={18} />, label: 'AI Avatar' },
        { type: 'camera', icon: <Video size={18} />, label: 'Camera' },
        { type: 'screen', icon: <MonitorPlay size={18} />, label: 'Screen Share' },
        { type: 'image', icon: <Layers size={18} />, label: 'Image' },
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold">Add Source</h3>

            <div className="grid grid-cols-2 gap-2">
                {sourceTypes.map((source) => (
                    <button
                        key={source.type}
                        className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex flex-col items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center text-accent-purple">
                            {source.icon}
                        </div>
                        <span className="text-xs">{source.label}</span>
                    </button>
                ))}
            </div>

            {activeScene && activeScene.sources.length > 0 && (
                <>
                    <div className="h-px bg-white/10 my-4" />
                    <h3 className="font-semibold">Active Sources</h3>
                    <div className="space-y-2">
                        {activeScene.sources.map((source) => (
                            <div
                                key={source.id}
                                className="p-3 rounded-xl bg-white/5 flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
                                    <Layers size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{source.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{source.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function ChatPanel() {
    const { chatMessages, chatPaused, toggleChatPause } = useStudioStore();

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Live Chat</h3>
                <button
                    onClick={toggleChatPause}
                    className={cn(
                        'text-xs px-3 py-1.5 rounded-lg transition-colors',
                        chatPaused
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-white/10 text-gray-400 hover:text-white'
                    )}
                >
                    {chatPaused ? 'Paused' : 'Pause'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent-purple/30 text-accent-purple">
                                {msg.platform}
                            </span>
                            <span className="text-sm font-medium text-accent-cyan">{msg.username}</span>
                        </div>
                        <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                ))}

                {chatMessages.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Chat will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function GuestsPanel() {
    const { guests } = useStudioStore();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Guests</h3>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors">
                    + Invite
                </button>
            </div>

            <div className="space-y-2">
                {guests.map((guest) => (
                    <div key={guest.id} className="p-3 rounded-xl bg-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-sm font-bold">
                            {guest.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">{guest.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{guest.status}</p>
                        </div>
                        <div className="flex gap-1">
                            {guest.audioEnabled ? (
                                <Mic size={16} className="text-green-400" />
                            ) : (
                                <MicOff size={16} className="text-red-400" />
                            )}
                            {guest.videoEnabled ? (
                                <Video size={16} className="text-green-400" />
                            ) : (
                                <VideoOff size={16} className="text-red-400" />
                            )}
                        </div>
                    </div>
                ))}

                {guests.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No guests connected</p>
                        <p className="text-xs">Invite guests to join</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingsPanel() {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold">Stream Settings</h3>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Stream Title</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Enter stream title..."
                        defaultValue="AI Avatar Livestream"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Description</label>
                    <textarea
                        className="input-field min-h-[80px] resize-none"
                        placeholder="Enter description..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Quality</label>
                    <select className="input-field">
                        <option>1080p 60fps</option>
                        <option>1080p 30fps</option>
                        <option>720p 60fps</option>
                        <option>720p 30fps</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
