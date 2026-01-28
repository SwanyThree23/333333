'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Radio,
    Sparkles,
    Users,
    Globe,
    Zap,
    Shield,
    Play,
    ArrowRight,
    Monitor,
    Mic,
    MessageSquare,
    BarChart3,
    Palette,
    Code2
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-burgundy to-accent-gold flex items-center justify-center">
                            <Radio size={20} />
                        </div>
                        <span className="font-bold text-xl">AI Avatar Studio</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
                        <a href="#docs" className="text-gray-300 hover:text-white transition-colors">Docs</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/auth/signin" className="text-gray-300 hover:text-white transition-colors text-sm font-medium mr-2">
                            Sign In
                        </Link>
                        <Link href="/studio" className="btn-primary flex items-center gap-2">
                            <Play size={18} />
                            Launch Studio
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-burgundy/20 text-accent-gold text-sm font-medium mb-8 border border-accent-burgundy/20">
                            <Sparkles size={16} />
                            Production-Grade AI Streaming
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            <span className="bg-gradient-to-r from-white via-accent-gold to-accent-burgundy bg-clip-text text-transparent">
                                AI-Powered
                            </span>
                            <br />
                            <span className="text-white">Livestream Studio</span>
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                            Create stunning livestreams with intelligent AI avatars, multi-platform broadcasting,
                            real-time guest management, and advanced analytics.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/studio" className="btn-primary text-lg px-8 py-4 flex items-center gap-3">
                                <Radio size={22} />
                                Open Studio
                                <ArrowRight size={18} />
                            </Link>
                            <button className="btn-secondary text-lg px-8 py-4">
                                Watch Demo
                            </button>
                        </div>
                    </motion.div>

                    {/* Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-16 relative"
                    >
                        <div className="aspect-video max-w-5xl mx-auto rounded-3xl bg-surface-300 border border-white/10 overflow-hidden shadow-2xl relative group">
                            <img
                                src="/.gemini/antigravity/brain/114a049d-93d5-413b-b689-0fe418a36b45/studio_dashboard_preview_1769611420841.png"
                                alt="Studio Dashboard"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                <div className="text-left">
                                    <p className="text-accent-gold font-bold mb-1">PRO STUDIO</p>
                                    <h3 className="text-2xl font-bold">Advanced Mixing & Control</h3>
                                </div>
                            </div>
                        </div>

                        {/* Floating badges */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="absolute -left-4 top-1/4 glass px-4 py-3 rounded-xl hidden lg:block"
                        >
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span>1.2K Viewers</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="absolute -right-4 top-1/3 glass px-4 py-3 rounded-xl hidden lg:block"
                        >
                            <div className="flex items-center gap-2 text-sm">
                                <Sparkles size={16} className="text-accent-gold" />
                                <span>AI Avatar Active</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">Everything You Need to Stream</h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Professional-grade features that make your livestreams stand out
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="card group"
                            >
                                <div className={`w-14 h-14 rounded-2xl mb-4 flex items-center justify-center ${feature.color}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* AI Avatar Showcase */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center glass p-8 lg:p-12 rounded-[40px] border border-white/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-burgundy/10 blur-[120px] -z-10" />

                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 text-accent-gold text-xs font-bold uppercase tracking-wider mb-6 border border-accent-gold/10">
                                <Sparkles size={14} />
                                Hyper-Realistic
                            </div>
                            <h2 className="text-4xl font-bold mb-6 leading-tight"> Photorealistic AI Hosts that <span className="text-accent-gold">Never Sleep.</span></h2>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Our AI avatars use state-of-the-art WebRTC streaming to deliver 4K60 quality hosts with zero latency.
                                Customize voice, personality, and appearance to match your brand perfectly.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {[
                                    '250+ Multilingual voices with ElevenLabs integration',
                                    'Real-time lip-sync with < 500ms latency',
                                    'AI Brain powered by GPT-4 for natural interaction',
                                    'Dynamic emotional cues and gestures'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-300">
                                        <div className="w-6 h-6 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold flex-shrink-0">
                                            <Zap size={14} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/studio" className="btn-secondary px-8 py-4 inline-flex items-center gap-2 group">
                                Explore Avatars
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative aspect-square rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
                        >
                            <img
                                src="/.gemini/antigravity/brain/114a049d-93d5-413b-b689-0fe418a36b45/ai_avatar_preview_1769611777341.png"
                                alt="AI Avatar Host"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                                <div className="glass px-6 py-4 rounded-2xl border border-white/10 w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Alex - Tech Host</p>
                                            <p className="text-xs text-gray-400">HeyGen Stream • ElevenLabs Neural</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="glass rounded-3xl p-12">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent-gold to-accent-burgundy bg-clip-text text-transparent mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-gray-400">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-accent-burgundy/10 blur-[150px] -z-10" />

                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass p-12 lg:p-20 rounded-[50px] border border-white/10 shadow-3xl"
                    >
                        <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
                            Ready to <span className="bg-gradient-to-r from-accent-gold to-accent-burgundy bg-clip-text text-transparent">Transform</span> Your Streams?
                        </h2>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Join over 50,000 creators who are redefining entertainment with AI.
                            Start your pro session in under 60 seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link href="/studio" className="btn-primary text-xl px-12 py-6 rounded-3xl flex items-center gap-3 w-full sm:w-auto shadow-neon-burgundy">
                                <Radio size={24} />
                                Launch Studio
                            </Link>
                            <button className="btn-secondary text-xl px-12 py-6 rounded-3xl w-full sm:w-auto hover:bg-white/10">
                                Contact Sales
                            </button>
                        </div>
                        <p className="mt-8 text-sm text-gray-500 italic">No credit card required. Launch for free.</p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-burgundy to-accent-gold flex items-center justify-center">
                            <Radio size={16} />
                        </div>
                        <span className="font-semibold">AI Avatar Studio</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                        © 2026 AI Avatar Studio. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

const features = [
    {
        title: 'AI Avatars',
        description: 'Create lifelike AI avatars that speak naturally and engage with your audience in real-time.',
        icon: <Sparkles size={24} />,
        color: 'bg-accent-gold/20 text-accent-gold',
    },
    {
        title: 'Multi-Platform',
        description: 'Broadcast simultaneously to YouTube, Twitch, Facebook, TikTok, and custom RTMP destinations.',
        icon: <Globe size={24} />,
        color: 'bg-accent-burgundy/20 text-accent-gold',
    },
    {
        title: 'Guest Management',
        description: 'Invite guests to join your stream with one click. Manage audio, video, and permissions easily.',
        icon: <Users size={24} />,
        color: 'bg-accent-gold/20 text-accent-gold',
    },
    {
        title: 'Live Analytics',
        description: 'Real-time viewer counts, engagement metrics, and platform breakdown at your fingertips.',
        icon: <BarChart3 size={24} />,
        color: 'bg-accent-gold/20 text-accent-gold',
    },
    {
        title: 'Scene Management',
        description: 'Create and switch between scenes with smooth transitions. Add overlays, images, and videos.',
        icon: <Monitor size={24} />,
        color: 'bg-accent-earth/20 text-accent-gold',
    },
    {
        title: 'Chat Integration',
        description: 'Unified chat from all platforms with AI moderation and real-time interaction capabilities.',
        icon: <MessageSquare size={24} />,
        color: 'bg-accent-burgundy/20 text-accent-gold',
    },
];

const stats = [
    { value: '50K+', label: 'Active Creators' },
    { value: '2M+', label: 'Hours Streamed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' },
];
