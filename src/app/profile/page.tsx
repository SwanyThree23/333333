'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Key, Video, BarChart3, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { streamApi } from '@/lib/api';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [streams, setStreams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            streamApi.getByUser(session.user.id)
                .then(res => setStreams(res.data || []))
                .finally(() => setIsLoading(false));
        }
    }, [session]);

    if (!session) return null;

    return (
        <div className="min-h-screen bg-surface-500 pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 space-y-6"
                >
                    <div className="card p-8 text-center flex flex-col items-center">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-accent-burgundy to-accent-gold p-1 shadow-neon-gold mb-6 relative">
                            <div className="w-full h-full rounded-[20px] bg-surface-400 flex items-center justify-center overflow-hidden">
                                {session.user.image ? (
                                    <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-gray-500" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-surface-500" title="Online" />
                        </div>

                        <h2 className="text-2xl font-bold">{session.user.name}</h2>
                        <p className="text-gray-400 flex items-center justify-center gap-2 mt-1">
                            <Mail size={14} />
                            {session.user.email}
                        </p>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 text-accent-gold text-xs font-bold uppercase mt-4 border border-accent-gold/10">
                            <Shield size={12} />
                            {(session.user as any).role || 'User'}
                        </div>

                        <div className="grid grid-cols-2 w-full gap-4 mt-8">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="text-2xl font-bold text-accent-gold">{streams.length}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Streams</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="text-2xl font-bold text-accent-burgundy">1.2k</div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Subscribers</div>
                            </div>
                        </div>

                        <div className="w-full space-y-3 mt-8">
                            <button className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
                                <SettingsIcon size={18} />
                                Edit Profile
                            </button>
                            <button className="w-full py-3 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-accent-gold" />
                            Account Details
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-gray-400">Member Since</span>
                                <span>Jan 2024</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-gray-400">Default Locale</span>
                                <span>en-US</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Storage Used</span>
                                <span>14.2 GB / 50 GB</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-8"
                >
                    {/* Recent Streams */}
                    <div className="glass rounded-[32px] p-8 border border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <Video className="text-accent-gold" />
                                Recent Streams
                            </h3>
                            <button className="text-accent-gold hover:underline text-sm font-medium">View All</button>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
                                </div>
                            ) : streams.length > 0 ? (
                                streams.map((stream) => (
                                    <div key={stream.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-gold/30 transition-all group flex items-center gap-4">
                                        <div className="w-32 aspect-video rounded-xl bg-surface-300 overflow-hidden relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BarChart3 className="text-gray-700" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold group-hover:text-accent-gold transition-colors">{stream.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(stream.createdAt).toLocaleDateString()}</p>
                                            <div className="flex gap-4 mt-2">
                                                <span className="text-xs text-gray-400">1.4k views</span>
                                                <span className="text-xs text-gray-400">82% retention</span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-white/5 text-xs text-gray-400 uppercase font-bold">
                                            {stream.status}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    No streams recorded yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Developer Tools (API Keys) */}
                    <div className="glass rounded-[32px] p-8 border border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <Key className="text-accent-burgundy" />
                                Developer Access
                            </h3>
                            <button className="btn-primary-sm">Generate Key</button>
                        </div>

                        <div className="p-6 rounded-2xl bg-accent-burgundy/5 border border-accent-burgundy/20">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-bold">Production API Key</p>
                                    <p className="text-xs text-gray-500">Last used: 2 hours ago</p>
                                </div>
                                <code className="bg-black/40 px-3 py-1 rounded-lg text-accent-gold border border-white/5">
                                    sk_live_••••••••••••••••
                                </code>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400 uppercase font-bold tracking-tighter">Read:Streams</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400 uppercase font-bold tracking-tighter">Write:Streams</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
