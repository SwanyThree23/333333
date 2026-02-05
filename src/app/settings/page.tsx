'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe, Bell, Monitor, Palette, Shield, Database, ChevronRight, Save } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: <SettingsIcon size={20} /> },
        { id: 'platforms', label: 'Platforms', icon: <Globe size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
        { id: 'display', label: 'Studio Display', icon: <Monitor size={20} /> },
        { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={20} /> },
    ];

    if (!session) return null;

    return (
        <div className="min-h-screen bg-surface-500 pt-24 pb-12 px-6">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-72 space-y-2"
                >
                    <h1 className="text-3xl font-bold mb-8 px-4">Settings</h1>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-accent-burgundy text-white shadow-neon-burgundy'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {tab.icon}
                            <span className="font-medium">{tab.label}</span>
                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                        </button>
                    ))}
                </motion.div>

                {/* Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 glass rounded-[32px] p-8 lg:p-10 border border-white/10"
                >
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">General Settings</h2>
                                <p className="text-gray-400">Manage your account identity and system preferences.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Profile Name</label>
                                    <input type="text" className="input-field h-12" defaultValue={session.user.name || ''} title="Profile Name" placeholder="Your Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                                    <input type="email" className="input-field h-12 opacity-50 cursor-not-allowed" defaultValue={session.user.email || ''} disabled title="Email Address" placeholder="Email" />
                                    <p className="text-[10px] text-gray-500 font-medium ml-1">Managed by authentication provider.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Timezone</label>
                                    <select className="input-field h-12 appearance-none" title="Timezone">
                                        <option>UTC (Coordinated Universal Time)</option>
                                        <option>PST (Pacific Standard Time)</option>
                                        <option>EST (Eastern Standard Time)</option>
                                        <option>GMT (London)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'platforms' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Streaming Platforms</h2>
                                <p className="text-gray-400">Connect and manage your RTMP outgoing destinations.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: 'YouTube Live', connected: true, icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
                                    { name: 'Twitch', connected: true, icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png' },
                                    { name: 'TikTok Live', connected: false, icon: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' },
                                ].map((platform) => (
                                    <div key={platform.name} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <img src={platform.icon} className="w-10 h-10 rounded-lg filter grayscale opacity-80" alt={platform.name} />
                                        <div className="flex-1">
                                            <p className="font-bold">{platform.name}</p>
                                            <p className="text-xs text-gray-500">{platform.connected ? 'Connected as primary' : 'Not configured'}</p>
                                        </div>
                                        <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${platform.connected ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-accent-gold text-black hover:bg-accent-gold/80'
                                            }`}>
                                            {platform.connected ? 'Manage' : 'Connect'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-white/10 flex justify-end">
                        <button className="btn-primary flex items-center gap-2 px-8 py-3">
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
