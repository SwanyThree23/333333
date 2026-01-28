'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, UserPlus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'follower' | 'donation' | 'subscriber' | 'raid';

interface Alert {
    id: string;
    type: AlertType;
    user: string;
    amount?: string;
    message?: string;
}

export function AlertOverlay() {
    const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
    const [queue, setQueue] = useState<Alert[]>([]);

    // Function to add a test alert
    useEffect(() => {
        const handleTestAlert = (e: any) => {
            const newAlert: Alert = {
                id: Math.random().toString(36).substr(2, 9),
                ...e.detail
            };
            setQueue(prev => [...prev, newAlert]);
        };

        window.addEventListener('stream-alert', handleTestAlert);
        return () => window.removeEventListener('stream-alert', handleTestAlert);
    }, []);

    useEffect(() => {
        if (!currentAlert && queue.length > 0) {
            const nextAlert = queue[0];
            setCurrentAlert(nextAlert);
            setQueue(prev => prev.slice(1));

            // Auto dismiss after 5 seconds
            const timer = setTimeout(() => {
                setCurrentAlert(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [currentAlert, queue]);

    return (
        <div className="fixed inset-0 pointer-events-none flex items-start justify-center pt-20">
            <AnimatePresence>
                {currentAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, y: -20 }}
                        className="relative z-50 px-10 py-6 rounded-3xl bg-surface-500/80 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col items-center min-w-[400px]"
                    >
                        {/* Animation effects */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl">
                            <motion.div
                                animate={{
                                    rotate: [0, 360],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-accent-burgundy/20 to-transparent blur-3xl opacity-30"
                            />
                            <motion.div
                                animate={{
                                    rotate: [360, 0],
                                    scale: [1, 1.3, 1]
                                }}
                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tr from-accent-gold/20 to-transparent blur-3xl opacity-30"
                            />
                        </div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className={cn(
                                "w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-xl",
                                currentAlert.type === 'follower' && "bg-blue-500 text-white shadow-blue-500/20",
                                currentAlert.type === 'donation' && "bg-accent-gold text-white shadow-accent-gold/20",
                                currentAlert.type === 'subscriber' && "bg-accent-burgundy text-white shadow-accent-burgundy/20"
                            )}>
                                {currentAlert.type === 'follower' && <UserPlus size={40} />}
                                {currentAlert.type === 'donation' && <DollarSign size={40} />}
                                {currentAlert.type === 'subscriber' && <Heart size={40} />}
                            </div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-black mb-2 uppercase tracking-tighter italic"
                            >
                                <span className="text-white">NEW </span>
                                <span className={cn(
                                    currentAlert.type === 'follower' && "text-blue-400",
                                    currentAlert.type === 'donation' && "text-accent-gold",
                                    currentAlert.type === 'subscriber' && "text-accent-burgundy"
                                )}>
                                    {currentAlert.type}
                                </span>
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-white text-4xl font-bold mb-4 drop-shadow-lg"
                            >
                                {currentAlert.user}
                                {currentAlert.amount && (
                                    <span className="text-accent-gold active:animate-bounce"> - {currentAlert.amount}</span>
                                )}
                            </motion.div>

                            {currentAlert.message && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-gray-300 text-lg italic max-w-sm"
                                >
                                    "{currentAlert.message}"
                                </motion.p>
                            )}
                        </div>

                        {/* Particle effects simulation */}
                        <div className="absolute -bottom-2 flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [-20, -100],
                                        opacity: [0, 1, 0],
                                        x: [0, (i - 3) * 20]
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-1 h-1 rounded-full bg-accent-gold"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
