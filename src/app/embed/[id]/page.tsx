'use client';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { Radio, Users, Play, Maximize2 } from 'lucide-react';
import { useState } from 'react';

export default function EmbedPage() {
    const { id } = useParams();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="w-full h-full bg-black overflow-hidden relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Stream Simulation */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=1280"
                    className="w-full h-full object-cover opacity-80"
                    alt="Stream"
                />
            </div>

            {/* Overlay UI */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                {/* Top Info */}
                <div className="absolute top-4 left-4 flex items-center gap-3">
                    <div className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        Live
                    </div>
                </div>

                {/* Center Play Button (if paused, normally this would be a real player) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="w-16 h-16 rounded-full bg-accent-gold/90 text-black flex items-center justify-center shadow-neon-gold"
                    >
                        <Play size={24} fill="currentColor" />
                    </motion.button>
                </div>

                {/* Bottom Bar */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-surface-300" />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-white/80">1,243 watching</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="text-white/60 hover:text-white transition-colors" title="Fullscreen">
                            <Maximize2 size={18} />
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-burgundy to-accent-gold p-0.5">
                            <div className="w-full h-full rounded-[6px] bg-black flex items-center justify-center">
                                <Radio size={12} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding (Small, always visible if not hovered) */}
            <div className={`absolute bottom-3 right-3 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400">Powered by</span>
                    <span className="text-[10px] font-black text-accent-gold tracking-tighter">AI AVATAR STUDIO</span>
                </div>
            </div>
        </div>
    );
}

// Note: Viewport is moved to layout.tsx
