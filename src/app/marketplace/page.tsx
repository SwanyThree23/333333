'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, ExternalLink, Hexagon, TrendingUp, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';

export default function MarketplacePage() {
    return (
        <div className="min-h-screen bg-surface-500 flex flex-col pt-16">
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
                {/* Header Sequence */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">
                            <ShoppingCart className="text-accent-gold" size={40} />
                            NFT Marketplace
                        </h1>
                        <p className="text-gray-400 text-lg">Earn, collect, and trade AI-generated highlights in real-time.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold transition-all flex items-center gap-2">
                            <TrendingUp size={18} className="text-accent-gold" />
                            Collections
                        </button>
                    </div>
                </div>

                {/* Mint Moment Prompt */}
                <div className="mb-12 p-8 glass rounded-[32px] border border-accent-gold/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                <Sparkles className="text-accent-gold" /> Make Your Mark
                            </h2>
                            <p className="text-gray-300 max-w-lg">
                                Just experienced an insane moment in the Studio? Hit "Mint Highlight" below to instantly generate an NFT encapsulating the last 30 seconds of broadcast. Fully automated via Swany AI.
                            </p>
                        </div>
                        <button className="px-8 py-4 rounded-xl bg-accent-gold text-black font-extrabold shadow-neon-gold hover:scale-105 transition-all flex items-center gap-2 flex-shrink-0">
                            <Plus size={20} />
                            Mint AI Highlight
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Hexagon size={20} />
                        Recent Drops
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -4 }}
                                className="glass rounded-[24px] border border-white/10 overflow-hidden flex flex-col group cursor-pointer"
                            >
                                <div className="aspect-square bg-black relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                                    <img
                                        src={`https://images.unsplash.com/photo-${1600000000000 + i * 5000}?auto=format&fit=crop&q=80&w=600`}
                                        className="w-full h-full object-cover"
                                        alt="NFT Thumbnail"
                                    />
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-accent-gold border border-white/10">
                                        {(Math.random() * 5 + 0.5).toFixed(2)} ETH
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="font-bold text-lg mb-1 group-hover:text-accent-gold transition-colors">Broadcast Fragment #0{i}</h3>
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">Autonomous highlight generated from Swany Studio testing sequence.</p>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-surface-300 overflow-hidden border border-white/10">
                                                <img src={`https://i.pravatar.cc/150?u=nft${i}`} alt="Owner" />
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">@creator{i}</span>
                                        </div>
                                        <button className="text-accent-gold hover:text-white transition-colors">
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
