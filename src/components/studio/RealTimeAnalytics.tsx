'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Users,
    MessageSquare,
    Heart,
    Share2,
    Clock,
    BarChart3,
    Play,
    Youtube,
    Twitch,
    Facebook,
    RefreshCw,
    DollarSign,
    UserPlus,
    Eye,
    Sparkles,
    Terminal
} from 'lucide-react';
import { cn, formatNumber, formatDuration } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';
import { StreamAnalytics } from '@/types';

interface RealTimeAnalyticsProps {
    streamId: string;
    className?: string;
}

export function RealTimeAnalytics({ streamId, className }: RealTimeAnalyticsProps) {
    const {
        analytics,
        setAnalytics,
        stream,
        isStreaming,
        streamDuration,
        aiInsights,
        directorLogs,
        aiLatency,
        aiConfidence
    } = useStudioStore();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [previousViewers, setPreviousViewers] = useState(0);

    const fetchAnalytics = useCallback(async () => {
        if (!streamId) return;

        try {
            setIsRefreshing(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/${streamId}`);
            const data = await res.json();

            setPreviousViewers(analytics?.totalViewers || 0);

            setAnalytics({
                totalViewers: data.totalViewers || 0,
                peakViewers: data.peakViewers || 0,
                averageWatchTime: data.averageWatchTime || 0,
                chatMessages: data.chatMessages || 0,
                reactions: data.reactions || 0,
                shares: data.shares || 0,
                newFollowers: data.newFollowers || 0,
                platformBreakdown: data.platformBreakdown || [],
                viewerTimeline: data.viewerTimeline || [],
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [streamId, setAnalytics, analytics?.totalViewers]);

    useEffect(() => {
        if (isStreaming && streamId) {
            fetchAnalytics();
            const interval = setInterval(fetchAnalytics, 10000); // Refresh every 10 seconds
            return () => clearInterval(interval);
        }
    }, [isStreaming, streamId, fetchAnalytics]);

    const viewerTrend = (analytics?.totalViewers || 0) - previousViewers;
    const trendPercentage = previousViewers > 0
        ? ((viewerTrend / previousViewers) * 100).toFixed(1)
        : '0';

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'youtube': return <Youtube size={16} className="text-red-500" />;
            case 'twitch': return <Twitch size={16} className="text-purple-500" />;
            case 'facebook': return <Facebook size={16} className="text-blue-500" />;
            default: return <Play size={16} className="text-gray-400" />;
        }
    };

    const stats = [
        {
            label: 'Live Viewers',
            value: stream?.viewerCount || analytics?.totalViewers || 0,
            icon: <Users size={18} />,
            color: 'gold',
            trend: viewerTrend !== 0 ? {
                value: `${viewerTrend > 0 ? '+' : ''}${trendPercentage}%`,
                positive: viewerTrend > 0
            } : null
        },
        {
            label: 'Peak Viewers',
            value: analytics?.peakViewers || 0,
            icon: <TrendingUp size={18} />,
            color: 'burgundy',
        },
        {
            label: 'Chat Messages',
            value: analytics?.chatMessages || 0,
            icon: <MessageSquare size={18} />,
            color: 'gold',
        },
        {
            label: 'Reactions',
            value: analytics?.reactions || 0,
            icon: <Heart size={18} />,
            color: 'burgundy',
        },
        {
            label: 'Shares',
            value: analytics?.shares || 0,
            icon: <Share2 size={18} />,
            color: 'green',
        },
        {
            label: 'New Followers',
            value: analytics?.newFollowers || 0,
            icon: <UserPlus size={18} />,
            color: 'blue',
        },
        {
            label: 'AI Latency',
            value: aiLatency > 0 ? `${aiLatency}ms` : '--',
            icon: <Terminal size={18} />,
            color: 'green',
        },
        {
            label: 'AI Confidence',
            value: aiConfidence > 0 ? `${(aiConfidence * 100).toFixed(0)}%` : '--',
            icon: <Sparkles size={18} />,
            color: 'gold',
        },
    ];

    return (
        <div className={cn('glass rounded-2xl p-5', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 size={20} className="text-accent-gold" />
                    Live Analytics
                </h2>
                <div className="flex items-center gap-3">
                    {isStreaming && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-medium text-red-400">
                                {formatDuration(streamDuration)}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={fetchAnalytics}
                        disabled={isRefreshing}
                        className={cn(
                            'p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors',
                            isRefreshing && 'animate-spin'
                        )}
                        title="Refresh Analytics"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                    >
                        <div className={cn(
                            'w-8 h-8 rounded-lg mb-2 flex items-center justify-center',
                            stat.color === 'gold' && 'bg-accent-gold/20 text-accent-gold',
                            stat.color === 'burgundy' && 'bg-accent-burgundy/20 text-accent-burgundy',
                            stat.color === 'green' && 'bg-green-500/20 text-green-400',
                            stat.color === 'blue' && 'bg-blue-500/20 text-blue-400',
                        )}>
                            {stat.icon}
                        </div>
                        <div className="flex items-end gap-1.5">
                            <span className="text-xl font-bold">
                                {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                            </span>
                            {stat.trend && (
                                <span className={cn(
                                    'text-xs flex items-center gap-0.5 mb-0.5',
                                    stat.trend.positive ? 'text-green-400' : 'text-red-400'
                                )}>
                                    {stat.trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {stat.trend.value}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-gray-500">{stat.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Platform Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Platform Viewers */}
                <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <Eye size={14} />
                        Platform Breakdown
                    </h3>
                    {analytics?.platformBreakdown && analytics.platformBreakdown.length > 0 ? (
                        <div className="space-y-3">
                            {analytics.platformBreakdown.map((platform) => (
                                <div key={platform.platform} className="flex items-center gap-3">
                                    {getPlatformIcon(platform.platform)}
                                    <span className="text-sm text-gray-400 w-16 capitalize">{platform.platform}</span>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${platform.percentage}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className={cn(
                                                'h-full rounded-full',
                                                platform.platform === 'youtube' && 'bg-red-500',
                                                platform.platform === 'twitch' && 'bg-purple-500',
                                                platform.platform === 'facebook' && 'bg-blue-500',
                                                !['youtube', 'twitch', 'facebook'].includes(platform.platform) && 'bg-gray-500'
                                            )}
                                        />
                                    </div>
                                    <span className="text-sm font-medium w-12 text-right">
                                        {formatNumber(platform.viewers)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            No platform data yet
                        </div>
                    )}
                </div>

                {/* Stream Health */}
                <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <Clock size={14} />
                        Stream Metrics
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Avg. Watch Time</span>
                            <span className="text-sm font-medium">
                                {analytics?.averageWatchTime
                                    ? formatDuration(analytics.averageWatchTime)
                                    : '--:--'
                                }
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Stream Duration</span>
                            <span className="text-sm font-medium">{formatDuration(streamDuration)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Engagement Rate</span>
                            <span className="text-sm font-medium">
                                {analytics && analytics.totalViewers > 0
                                    ? ((analytics.chatMessages + analytics.reactions) / analytics.totalViewers * 100).toFixed(1)
                                    : '0'
                                }%
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Chat Rate</span>
                            <span className="text-sm font-medium">
                                {streamDuration > 0
                                    ? Math.round((analytics?.chatMessages || 0) / (streamDuration / 60))
                                    : 0
                                }/min
                            </span>
                        </div>
                    </div>
                </div>

                {/* AI Insights & Director Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* AI Insights */}
                    <div className="p-4 rounded-xl bg-accent-gold/5 border border-accent-gold/10">
                        <h3 className="text-sm font-medium text-accent-gold mb-3 flex items-center gap-2">
                            <Sparkles size={14} />
                            AI Stream Insights
                        </h3>
                        <div className="text-sm text-gray-300 leading-relaxed italic">
                            {aiInsights ? (
                                aiInsights
                            ) : (
                                <span className="text-gray-500">
                                    AI is currently analyzing your stream data. Insights will appear here every 2 minutes.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Director Logs */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <Terminal size={14} />
                            Director Automation Log
                        </h3>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                            {directorLogs.length > 0 ? (
                                directorLogs.map((log) => (
                                    <div key={log.id} className="text-[11px] flex gap-2">
                                        <span className="text-gray-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <span className={cn(
                                            'font-medium',
                                            log.type === 'success' && 'text-green-400',
                                            log.type === 'warning' && 'text-amber-400',
                                            log.type === 'info' && 'text-blue-400'
                                        )}>
                                            [{log.type.toUpperCase()}]
                                        </span>
                                        <span className="text-gray-400">{log.message}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-xs italic">
                                    No automation events logged yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
