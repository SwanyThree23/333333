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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-purple/20 text-accent-purple text-sm font-medium mb-8">
                            <Sparkles size={16} />
                            Production-Grade AI Streaming
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            <span className="bg-gradient-to-r from-white via-accent-cyan to-accent-purple bg-clip-text text-transparent">
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
                        <div className="aspect-video max-w-5xl mx-auto rounded-2xl bg-surface-300 border border-white/10 overflow-hidden shadow-2xl">
                            <div className="w-full h-full bg-gradient-to-br from-surface-200 via-surface-300 to-surface-400 flex items-center justify-center relative">
                                {/* Decorative elements */}
                                <div className="absolute inset-0 opacity-30">
                                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-cyan/30 rounded-full blur-[100px]" />
                                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-purple/30 rounded-full blur-[100px]" />
                                </div>

                                <div className="relative z-10 text-center">
                                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center backdrop-blur-xl border border-white/20">
                                        <Play size={40} className="text-white ml-2" />
                                    </div>
                                    <p className="text-gray-400">Studio Preview</p>
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
                                <Sparkles size={16} className="text-accent-cyan" />
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

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent mb-2">
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
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Transform Your Streams?
                        </h2>
                        <p className="text-xl text-gray-400 mb-10">
                            Join thousands of creators using AI Avatar Studio to create amazing content.
                        </p>
                        <Link href="/studio" className="btn-primary text-lg px-10 py-5 inline-flex items-center gap-3">
                            <Radio size={22} />
                            Launch Studio Now
                            <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
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
        color: 'bg-accent-cyan/20 text-accent-cyan',
    },
    {
        title: 'Multi-Platform',
        description: 'Broadcast simultaneously to YouTube, Twitch, Facebook, TikTok, and custom RTMP destinations.',
        icon: <Globe size={24} />,
        color: 'bg-accent-purple/20 text-accent-purple',
    },
    {
        title: 'Guest Management',
        description: 'Invite guests to join your stream with one click. Manage audio, video, and permissions easily.',
        icon: <Users size={24} />,
        color: 'bg-accent-pink/20 text-accent-pink',
    },
    {
        title: 'Live Analytics',
        description: 'Real-time viewer counts, engagement metrics, and platform breakdown at your fingertips.',
        icon: <BarChart3 size={24} />,
        color: 'bg-accent-orange/20 text-accent-orange',
    },
    {
        title: 'Scene Management',
        description: 'Create and switch between scenes with smooth transitions. Add overlays, images, and videos.',
        icon: <Monitor size={24} />,
        color: 'bg-green-500/20 text-green-400',
    },
    {
        title: 'Chat Integration',
        description: 'Unified chat from all platforms with AI moderation and real-time interaction capabilities.',
        icon: <MessageSquare size={24} />,
        color: 'bg-blue-500/20 text-blue-400',
    },
];

const stats = [
    { value: '50K+', label: 'Active Creators' },
    { value: '2M+', label: 'Hours Streamed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' },
];
