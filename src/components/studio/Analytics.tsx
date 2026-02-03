'use client';

import { motion } from 'framer-motion';
import {
    TrendingUp,
    Users,
    MessageSquare,
    Heart,
    Share2,
    DollarSign,
    Clock,
    BarChart3
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';

interface AnalyticsDashboardProps {
    className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
    const { analytics, stream } = useStudioStore();

    const stats = [
        {
            label: 'Viewers',
            value: stream?.viewerCount || 0,
            icon: <Users size={20} />,
            color: 'gold',
            change: '+12%',
        },
        {
            label: 'Peak Viewers',
            value: analytics?.peakViewers || 0,
            icon: <TrendingUp size={20} />,
            color: 'burgundy',
        },
        {
            label: 'Chat Messages',
            value: analytics?.chatMessages || 0,
            icon: <MessageSquare size={20} />,
            color: 'gold',
            change: '+28%',
        },
        {
            label: 'Reactions',
            value: analytics?.reactions || 0,
            icon: <Heart size={20} />,
            color: 'burgundy',
        },
    ];

    return (
        <div className={cn('glass rounded-2xl p-6', className)}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 size={20} className="text-accent-gold" />
                    Live Analytics
                </h2>
                <span className="text-xs text-gray-400">Real-time</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className={cn(
                            'w-10 h-10 rounded-xl mb-3 flex items-center justify-center',
                            stat.color === 'gold' && 'bg-accent-gold/20 text-accent-gold',
                            stat.color === 'burgundy' && 'bg-accent-burgundy/20 text-accent-burgundy',
                        )}>
                            {stat.icon}
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold">{formatNumber(stat.value)}</span>
                            {stat.change && (
                                <span className="text-xs text-green-400 mb-1">{stat.change}</span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400">{stat.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Platform Breakdown */}
            {analytics?.platformBreakdown && analytics.platformBreakdown.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Platform Viewers</h3>
                    <div className="space-y-2">
                        {analytics.platformBreakdown.map((platform) => (
                            <div key={platform.platform} className="flex items-center gap-3">
                                <span className="text-sm text-gray-400 w-20 capitalize">{platform.platform}</span>
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${platform.percentage}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-accent-burgundy to-accent-gold rounded-full"
                                    />
                                </div>
                                <span className="text-sm font-medium w-16 text-right">
                                    {formatNumber(platform.viewers)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface QuickStatsProps {
    className?: string;
}

export function QuickStats({ className }: QuickStatsProps) {
    const stats = [
        { icon: <Users size={16} />, label: 'Viewers', value: '1.2K' },
        { icon: <MessageSquare size={16} />, label: 'Chat', value: '342' },
        { icon: <Heart size={16} />, label: 'Likes', value: '892' },
        { icon: <Share2 size={16} />, label: 'Shares', value: '56' },
    ];

    return (
        <div className={cn('flex items-center gap-4', className)}>
            {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">{stat.icon}</span>
                    <span className="text-sm font-medium">{stat.value}</span>
                </div>
            ))}
        </div>
    );
}
