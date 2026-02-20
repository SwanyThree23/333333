'use client';

import { motion } from 'framer-motion';
import { Play, Users, Sparkles, TrendingUp, Compass, Radio } from 'lucide-react';
import Link from 'next/link';

export default function BrowsePage() {
    return (
        <div className="min-h-screen bg-surface-500 flex flex-col pt-16">
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
                {/* Header Sequence */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">
                            <Compass className="text-accent-gold" size={40} />
                            Browse Live
                        </h1>
                        <p className="text-gray-400 text-lg">Discover AI-orchestrated livestreams and digital hosts.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold transition-all flex items-center gap-2">
                            <TrendingUp size={18} className="text-accent-gold" />
                            Trending
                        </button>
                        <button className="px-6 py-2.5 rounded-full bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30 font-bold transition-all flex items-center gap-2 border border-accent-gold/50">
                            <Sparkles size={18} />
                            Discover AI
                        </button>
                    </div>
                </div>

                {/* Featured Live Board */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Radio className="text-red-500 animate-pulse" size={20} />
                        Featured Broadcast
                    </h2>
                    <Link href="/watch/featured">
                        <motion.div
                            whileHover={{ scale: 0.995 }}
                            className="w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden relative group border border-accent-gold/20 shadow-neon-gold"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=1280"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                alt="Featured Stream"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Live
                                    </div>
                                    <div className="glass px-3 py-1 rounded-md text-xs font-bold text-white flex items-center gap-2">
                                        <Users size={14} />
                                        24.5k
                                    </div>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black mb-2">The Future of AI Streaming</h3>
                                <p className="text-gray-300 md:text-lg max-w-2xl">Join Swany Studio for a fully autonomous broadcast powered by real-time LLMs and instant RTMP fan-out.</p>
                            </div>
                        </motion.div>
                    </Link>
                </div>

                {/* Live Channels Grid */}
                <div>
                    <h2 className="text-xl font-bold mb-6">Live Channels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Link href={`/watch/demo-${i}`} key={i}>
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="group cursor-pointer"
                                >
                                    <div className="aspect-video rounded-2xl overflow-hidden relative mb-4 border border-white/10 group-hover:border-accent-gold/50 transition-colors">
                                        <img
                                            src={`https://images.unsplash.com/photo-${1500000000000 + i * 10000}?auto=format&fit=crop&q=80&w=800`}
                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                            alt="Stream Thumbnail"
                                        />
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <div className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                                                Live
                                            </div>
                                            <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                <Users size={10} />
                                                {(Math.random() * 5 + 0.1).toFixed(1)}k
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-surface-300 overflow-hidden flex-shrink-0 border border-white/5">
                                            <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-100 line-clamp-1 group-hover:text-accent-gold transition-colors">
                                                Digital Horizon Broadcast {i}
                                            </h4>
                                            <p className="text-sm text-gray-400">Creator {i}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] font-bold">Tech</span>
                                                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] font-bold">WebRTC</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
