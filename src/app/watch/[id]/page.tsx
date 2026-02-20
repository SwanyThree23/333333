'use client';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { Radio, Users, MessageSquare, Share2, Heart, Shield, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import GoldBoardGrid from '@/components/GoldBoardGrid';
import HostTile from '@/components/HostTile';
import { ExternalLink, DollarSign, Wallet } from 'lucide-react';

export default function WatchPage() {
    const { id } = useParams();
    const [viewerCount, setViewerCount] = useState(1243);
    const [isLiked, setIsLiked] = useState(false);

    // Dynamic viewer count simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setViewerCount(prev => prev + Math.floor(Math.random() * 5) - 2);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-surface-500 flex flex-col pt-16">
            <div className="flex-1 flex flex-col lg:flex-row h-full">
                {/* Main Player Area */}
                <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto custom-scrollbar">
                    {/* Gold Board Grid Layout */}
                    <GoldBoardGrid hostId="host-123">
                        <HostTile pinned>
                            {/* Video Player Placeholder */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="aspect-video w-full bg-black relative group"
                            >
                                {/* Simulation of a live stream */}
                                <div className="absolute inset-0 bg-gradient-to-br from-surface-300 to-black flex items-center justify-center">
                                    <img
                                        src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=1280"
                                        className="w-full h-full object-cover opacity-60"
                                        alt="Stream preview"
                                    />
                                    <div className="absolute top-6 left-6 flex items-center gap-3">
                                        <div className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            Live
                                        </div>
                                        <div className="glass px-3 py-1 rounded-md text-xs font-bold text-white flex items-center gap-2">
                                            <Users size={14} />
                                            {viewerCount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Player Controls Overlay (Fake) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                                    <div className="w-full flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full bg-accent-gold" />
                                            <span className="text-sm font-medium">1080p60 • Surround Audio</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </HostTile>

                        {/* Guest Tiles Placeholder */}
                        {/* More tiles will be rendered as children to flow in the grid */}
                    </GoldBoardGrid>

                    {/* Stream Info */}
                    <div className="mt-8 flex flex-col md:flex-row items-start justify-between gap-6">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-burgundy to-accent-gold p-0.5 shadow-neon-gold">
                                <div className="w-full h-full rounded-[14px] bg-surface-400 overflow-hidden">
                                    <img src="https://i.pravatar.cc/150?u=studio" alt="Broadcaster" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    AI-Driven Late Night Tech Talk
                                    <Sparkles size={18} className="text-accent-gold" />
                                </h1>
                                <p className="text-gray-400 mt-1">Swany Studio • 2.4M followers</p>
                                <div className="flex gap-2 mt-4">
                                    <span className="px-3 py-1 rounded-full bg-accent-gold/10 text-accent-gold text-xs font-bold">Technology</span>
                                    <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold">AI Chat</span>
                                    <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold">English</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setIsLiked(!isLiked)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all ${isLiked ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                                {isLiked ? 'Liked' : 'Like'}
                            </button>
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-gray-300 hover:bg-white/10 transition-all">
                                <Share2 size={20} />
                                Share
                            </button>
                            <button className="btn-primary-sm px-8 py-3 h-auto">Follow</button>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 glass rounded-[32px] border border-white/10">
                            <h3 className="font-bold mb-2">About the Stream</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Welcome to the world's first fully AI-orchestrated livestream. Tonight we're discussing the cross-section
                                of neural networks and real-time streaming technology. Don't forget to interact with the AI Director in chat!
                            </p>
                        </div>
                        <div className="p-6 glass rounded-[32px] border border-accent-gold/20 bg-gradient-to-br from-surface-400 to-black/40">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-accent-gold">
                                <DollarSign size={18} /> Support the Creator (100% direct)
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                <a href="https://paypal.me/demo" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#00457C] text-white hover:bg-[#003B6A] transition-colors text-sm font-medium shadow-lg">
                                    PayPal <ExternalLink size={14} />
                                </a>
                                <a href="https://cash.app/$demo" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#00D632] text-black hover:bg-[#00C02D] transition-colors text-sm font-medium shadow-lg">
                                    Cash App <ExternalLink size={14} />
                                </a>
                                <a href="https://venmo.com/demo" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#008CFF] text-white hover:bg-[#007AE6] transition-colors text-sm font-medium shadow-lg">
                                    Venmo <ExternalLink size={14} />
                                </a>
                                <button onClick={() => alert('Zelle info: demo-email@zelle.com')} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#7122C1] text-white hover:bg-[#5D1B9F] transition-colors text-sm font-medium shadow-lg">
                                    Zelle <Wallet size={14} />
                                </button>
                                <button onClick={() => alert('Chime Sign: $demo-chime')} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#20B048] text-white hover:bg-[#1A963B] transition-colors text-sm font-medium shadow-lg">
                                    Chime <Wallet size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-full lg:w-96 border-l border-white/5 bg-surface-400/50 flex flex-col h-[600px] lg:h-auto">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-widest text-gray-400">
                            <MessageSquare size={14} className="text-accent-gold" />
                            Live Chat
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-accent-gold font-bold">
                            <Shield size={10} />
                            MODERATED BY AI
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {[
                            { user: 'DigitalNomad', msg: 'The quality of the AI host is incredible tonight! 🙌', role: 'viewer' },
                            { user: 'TechWiz', msg: 'Are those real-time reactions?', role: 'moderator' },
                            { user: 'AI_AGENT', msg: 'Welcome @TechWiz! Yes, I respond in under 300ms.', role: 'ai' },
                            { user: 'GamerX', msg: 'Is there a latency test we can run?', role: 'viewer' },
                            { user: 'StudioAdmin', msg: 'Please keep the chat respectful. Enjoy the stream!', role: 'admin' },
                        ].map((chat, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-surface-300 flex-shrink-0" />
                                <div>
                                    <span className={`text-xs font-bold mr-2 ${chat.role === 'ai' ? 'text-accent-gold' :
                                        chat.role === 'admin' ? 'text-accent-burgundy' : 'text-gray-400'
                                        }`}>
                                        {chat.user}
                                    </span>
                                    <p className="text-sm text-gray-300 mt-0.5">{chat.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-surface-500/50">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Send a message..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-gold/50 transition-all pr-12"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg text-accent-gold" title="Send Message">
                                <Sparkles size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
