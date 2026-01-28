'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Send,
    Pause,
    Play,
    Trash2,
    Star,
    Ban,
    Gift,
    Youtube,
    Twitch,
    Facebook,
    Filter,
    Search,
    Volume2,
    VolumeX,
    Settings,
    Sparkles
} from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';
import { ChatMessage } from '@/types';

interface ChatPanelProps {
    streamId: string;
    className?: string;
}

export function ChatPanel({ streamId, className }: ChatPanelProps) {
    const { chatMessages, chatPaused, toggleChatPause, addChatMessage, clearChat } = useStudioStore();
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [highlightDonations, setHighlightDonations] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (!chatPaused && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages, chatPaused]);

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'youtube': return <Youtube size={12} className="text-red-500" />;
            case 'twitch': return <Twitch size={12} className="text-purple-500" />;
            case 'facebook': return <Facebook size={12} className="text-blue-500" />;
            default: return <MessageSquare size={12} className="text-gray-400" />;
        }
    };

    const filteredMessages = chatMessages.filter((msg) => {
        if (filter !== 'all' && msg.platform.toLowerCase() !== filter) return false;
        if (searchQuery && !msg.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !msg.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleHighlight = (messageId: string) => {
        // In a real app, this would call an API to highlight the message
        console.log('Highlight message:', messageId);
    };

    const handleBanUser = (username: string) => {
        // In a real app, this would call an API to ban the user
        console.log('Ban user:', username);
    };

    const handleAiResponse = async (message: ChatMessage) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/chat-response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message.message,
                    streamTopic: 'general',
                    previousResponses: [],
                }),
            });

            const data = await res.json();
            if (data.response) {
                // Add AI response to chat
                addChatMessage({
                    id: `ai-${Date.now()}`,
                    platform: 'ai',
                    username: 'AI Assistant',
                    message: data.response,
                    timestamp: new Date(),
                    highlighted: true,
                    badges: ['ai'],
                });
            }
        } catch (error) {
            console.error('Failed to generate AI response:', error);
        }
    };

    return (
        <div className={cn('glass rounded-2xl flex flex-col h-full', className)}>
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare size={18} className="text-accent-gold" />
                        Live Chat
                        <span className="text-xs bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded-full">
                            {chatMessages.length}
                        </span>
                    </h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleChatPause}
                            className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                chatPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            )}
                            title={chatPaused ? 'Resume' : 'Pause'}
                        >
                            {chatPaused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                showSettings ? 'bg-accent-gold/20 text-accent-gold' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            )}
                            title="Settings"
                        >
                            <Settings size={14} />
                        </button>
                        <button
                            onClick={clearChat}
                            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            title="Clear Chat"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 mb-3 overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                    {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    Text-to-Speech
                                </span>
                                <button
                                    onClick={() => setTtsEnabled(!ttsEnabled)}
                                    className={cn(
                                        'w-10 h-5 rounded-full transition-colors relative',
                                        ttsEnabled ? 'bg-accent-gold' : 'bg-gray-600'
                                    )}
                                    title={ttsEnabled ? 'Disable TTS' : 'Enable TTS'}
                                    aria-label={ttsEnabled ? 'Disable TTS' : 'Enable TTS'}
                                >
                                    <div className={cn(
                                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
                                        ttsEnabled ? 'left-5' : 'left-0.5'
                                    )} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                    <Gift size={14} />
                                    Highlight Donations
                                </span>
                                <button
                                    onClick={() => setHighlightDonations(!highlightDonations)}
                                    className={cn(
                                        'w-10 h-5 rounded-full transition-colors relative',
                                        highlightDonations ? 'bg-accent-gold' : 'bg-gray-600'
                                    )}
                                    title={highlightDonations ? 'Hide Donation Highlights' : 'Show Donation Highlights'}
                                    aria-label={highlightDonations ? 'Hide Donation Highlights' : 'Show Donation Highlights'}
                                >
                                    <div className={cn(
                                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
                                        highlightDonations ? 'left-5' : 'left-0.5'
                                    )} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search & Filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="input-field pl-9 text-xs py-2"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input-field text-xs py-2 w-24"
                        title="Filter by platform"
                    >
                        <option value="all">All</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitch">Twitch</option>
                        <option value="facebook">Facebook</option>
                    </select>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2"
            >
                {filteredMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {filteredMessages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className={cn(
                                    'group p-2.5 rounded-xl transition-colors',
                                    message.highlighted
                                        ? 'bg-accent-gold/10 border border-accent-gold/30'
                                        : message.donation && highlightDonations
                                            ? 'bg-accent-burgundy/10 border border-accent-burgundy/30'
                                            : 'bg-white/5 hover:bg-white/8'
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    {/* Avatar */}
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-burgundy to-accent-gold flex items-center justify-center flex-shrink-0">
                                        {message.userAvatar ? (
                                            <img src={message.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-white">
                                                {message.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Username & Platform */}
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            {getPlatformIcon(message.platform)}
                                            <span className="text-xs font-semibold truncate">{message.username}</span>
                                            {message.badges?.map((badge) => (
                                                <span
                                                    key={badge}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-accent-burgundy/20 text-accent-gold"
                                                >
                                                    {badge}
                                                </span>
                                            ))}
                                            {message.donation && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-gold/20 text-accent-gold flex items-center gap-0.5">
                                                    <Gift size={10} />
                                                    {message.donation.currency}{message.donation.amount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Message */}
                                        <p className="text-sm text-gray-200 break-words">{message.message}</p>

                                        {/* Timestamp */}
                                        <span className="text-[10px] text-gray-500 mt-1 block">
                                            {formatTimeAgo(message.timestamp)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleHighlight(message.id)}
                                            className="p-1 rounded text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/20"
                                            title="Highlight"
                                        >
                                            <Star size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleAiResponse(message)}
                                            className="p-1 rounded text-gray-400 hover:text-accent-gold hover:bg-accent-gold/20"
                                            title="AI Response"
                                        >
                                            <Sparkles size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleBanUser(message.username)}
                                            className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-400/20"
                                            title="Ban User"
                                        >
                                            <Ban size={12} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Paused Indicator */}
            {chatPaused && (
                <div className="px-4 py-2 bg-yellow-500/20 border-t border-yellow-500/30 text-center">
                    <span className="text-xs text-yellow-400 flex items-center justify-center gap-1">
                        <Pause size={12} />
                        Chat paused - Scroll to see new messages
                    </span>
                </div>
            )}
        </div>
    );
}
