/**
 * Stream Service
 * Handles multi-platform streaming with RTMP distribution
 */

import { v4 as uuidv4 } from 'uuid';

export interface Platform {
    id: string;
    name: 'youtube' | 'twitch' | 'facebook' | 'tiktok' | 'custom';
    rtmpUrl: string;
    streamKey: string;
    status: 'disconnected' | 'connecting' | 'connected' | 'streaming' | 'error';
    viewerCount: number;
    chatEnabled: boolean;
    lastError?: string;
}

export interface StreamConfig {
    id: string;
    title: string;
    description: string;
    quality: '720p30' | '720p60' | '1080p30' | '1080p60' | '4k30';
    bitrate: number;
    fps: number;
    keyframeInterval: number;
    platforms: Platform[];
    startedAt: Date | null;
    endedAt: Date | null;
    status: 'idle' | 'preparing' | 'live' | 'ending' | 'ended';
}

export interface StreamStats {
    streamId: string;
    totalViewers: number;
    peakViewers: number;
    duration: number;
    bytesTransferred: number;
    droppedFrames: number;
    averageBitrate: number;
    platformStats: Map<string, { viewers: number; chatMessages: number }>;
}

export class StreamService {
    private activeStreams: Map<string, StreamConfig> = new Map();
    private streamStats: Map<string, StreamStats> = new Map();

    // Quality presets
    private qualityPresets = {
        '720p30': { width: 1280, height: 720, fps: 30, bitrate: 3000 },
        '720p60': { width: 1280, height: 720, fps: 60, bitrate: 4500 },
        '1080p30': { width: 1920, height: 1080, fps: 30, bitrate: 4500 },
        '1080p60': { width: 1920, height: 1080, fps: 60, bitrate: 6000 },
        '4k30': { width: 3840, height: 2160, fps: 30, bitrate: 15000 },
    };

    // Platform RTMP endpoints
    private platformEndpoints = {
        youtube: 'rtmp://a.rtmp.youtube.com/live2',
        twitch: 'rtmp://live.twitch.tv/app',
        facebook: 'rtmps://live-api-s.facebook.com:443/rtmp',
        tiktok: 'rtmp://push.tiktok.com/live',
        custom: '',
    };

    /**
     * Create a new stream configuration
     */
    createStream(config: Partial<StreamConfig>): StreamConfig {
        const id = uuidv4();
        const quality = config.quality || '1080p30';
        const preset = this.qualityPresets[quality];

        const stream: StreamConfig = {
            id,
            title: config.title || 'Untitled Stream',
            description: config.description || '',
            quality,
            bitrate: preset.bitrate,
            fps: preset.fps,
            keyframeInterval: 2,
            platforms: config.platforms || [],
            startedAt: null,
            endedAt: null,
            status: 'idle',
        };

        this.activeStreams.set(id, stream);
        return stream;
    }

    /**
     * Add a platform destination to the stream
     */
    addPlatform(
        streamId: string,
        platform: Omit<Platform, 'id' | 'status' | 'viewerCount'>
    ): Platform | null {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return null;

        const newPlatform: Platform = {
            id: uuidv4(),
            ...platform,
            rtmpUrl: platform.rtmpUrl || this.platformEndpoints[platform.name] || '',
            status: 'disconnected',
            viewerCount: 0,
            chatEnabled: platform.chatEnabled ?? true,
        };

        stream.platforms.push(newPlatform);
        return newPlatform;
    }

    /**
     * Remove a platform from the stream
     */
    removePlatform(streamId: string, platformId: string): boolean {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return false;

        const index = stream.platforms.findIndex(p => p.id === platformId);
        if (index === -1) return false;

        stream.platforms.splice(index, 1);
        return true;
    }

    /**
     * Start streaming to all configured platforms
     */
    async startStream(streamId: string): Promise<{ success: boolean; errors: string[] }> {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            return { success: false, errors: ['Stream not found'] };
        }

        if (stream.platforms.length === 0) {
            return { success: false, errors: ['No platforms configured'] };
        }

        const errors: string[] = [];
        stream.status = 'preparing';

        // Connect to each platform
        for (const platform of stream.platforms) {
            try {
                platform.status = 'connecting';
                // In production, this would actually connect to RTMP
                await this.simulateConnection(platform);
                platform.status = 'streaming';
            } catch (error) {
                platform.status = 'error';
                platform.lastError = error instanceof Error ? error.message : 'Connection failed';
                errors.push(`${platform.name}: ${platform.lastError}`);
            }
        }

        // Check if at least one platform is streaming
        const hasActiveStream = stream.platforms.some(p => p.status === 'streaming');
        if (hasActiveStream) {
            stream.status = 'live';
            stream.startedAt = new Date();
            this.initializeStats(streamId);
            return { success: true, errors };
        }

        stream.status = 'idle';
        return { success: false, errors };
    }

    /**
     * Stop streaming to all platforms
     */
    async stopStream(streamId: string): Promise<boolean> {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return false;

        stream.status = 'ending';

        for (const platform of stream.platforms) {
            if (platform.status === 'streaming') {
                platform.status = 'disconnected';
            }
        }

        stream.status = 'ended';
        stream.endedAt = new Date();

        return true;
    }

    /**
     * Get stream by ID
     */
    getStream(streamId: string): StreamConfig | null {
        return this.activeStreams.get(streamId) || null;
    }

    /**
     * Get all active streams
     */
    getActiveStreams(): StreamConfig[] {
        return Array.from(this.activeStreams.values()).filter(
            s => s.status === 'live' || s.status === 'preparing'
        );
    }

    /**
     * Get stream statistics
     */
    getStats(streamId: string): StreamStats | null {
        return this.streamStats.get(streamId) || null;
    }

    /**
     * Update viewer count for a platform
     */
    updateViewerCount(streamId: string, platformId: string, count: number): void {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return;

        const platform = stream.platforms.find(p => p.id === platformId);
        if (platform) {
            platform.viewerCount = count;
        }

        const stats = this.streamStats.get(streamId);
        if (stats) {
            const totalViewers = stream.platforms.reduce((sum, p) => sum + p.viewerCount, 0);
            stats.totalViewers = totalViewers;
            stats.peakViewers = Math.max(stats.peakViewers, totalViewers);
        }
    }

    /**
     * Get total viewer count across all platforms
     */
    getTotalViewers(streamId: string): number {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return 0;

        return stream.platforms.reduce((sum, p) => sum + p.viewerCount, 0);
    }

    /**
     * Generate OBS/streaming software settings
     */
    getEncoderSettings(streamId: string): object | null {
        const stream = this.activeStreams.get(streamId);
        if (!stream) return null;

        const preset = this.qualityPresets[stream.quality];
        return {
            encoder: 'x264',
            rateControl: 'CBR',
            bitrate: preset.bitrate,
            keyframeInterval: stream.keyframeInterval,
            preset: 'veryfast',
            profile: 'high',
            tune: 'zerolatency',
            resolution: `${preset.width}x${preset.height}`,
            fps: preset.fps,
            audioCodec: 'AAC',
            audioBitrate: 160,
            audioSampleRate: 48000,
        };
    }

    // Private helpers
    private async simulateConnection(platform: Platform): Promise<void> {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Simulate occasional failures for testing
        if (Math.random() < 0.05) {
            throw new Error('Simulated connection failure');
        }
    }

    private initializeStats(streamId: string): void {
        this.streamStats.set(streamId, {
            streamId,
            totalViewers: 0,
            peakViewers: 0,
            duration: 0,
            bytesTransferred: 0,
            droppedFrames: 0,
            averageBitrate: 0,
            platformStats: new Map(),
        });
    }
}

// Singleton instance
let streamServiceInstance: StreamService | null = null;

export function getStreamService(): StreamService {
    if (!streamServiceInstance) {
        streamServiceInstance = new StreamService();
    }
    return streamServiceInstance;
}
