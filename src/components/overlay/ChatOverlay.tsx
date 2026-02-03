'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

interface ChatOverlayProps {
    messages: ChatMessage[];
    maxMessages?: number;
    className?: string;
}

export function ChatOverlay({ messages, maxMessages = 10, className }: ChatOverlayProps) {
    const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        // Keep only the latest N messages
        setVisibleMessages(messages.slice(-maxMessages));
    }, [messages, maxMessages]);

    return (
        <div className={cn('flex flex-col gap-2 p-6 pointer-events-none', className)}>
            <AnimatePresence initial={false}>
                {visibleMessages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={cn(
                            'p-3 rounded-xl backdrop-blur-md max-w-[400px]',
                            msg.highlighted
                                ? 'bg-accent-burgundy/40 border border-accent-burgundy/50 shadow-lg shadow-accent-burgundy/20'
                                : 'bg-black/40 border border-white/5 shadow-sm'
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-accent-gold text-sm drop-shadow-sm">
                                {msg.username}
                            </span>
                            {msg.platform && (
                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                                    {msg.platform}
                                </span>
                            )}
                        </div>
                        <p className="text-white text-sm leading-relaxed drop-shadow-sm">
                            {msg.message}
                        </p>

                        {msg.donation && (
                            <div className="mt-2 flex items-center gap-2 text-accent-gold font-bold text-sm">
                                <span className="px-2 py-0.5 rounded-full bg-accent-gold/20 border border-accent-gold/30">
                                    {msg.donation.currency}{msg.donation.amount}
                                </span>
                                <span className="animate-pulse">✨ GENERATED DONATION ✨</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
