'use client';

import { useEffect, useRef, useState } from 'react';
import { avatarApi } from '@/lib/api';
import { useStudioStore } from '@/lib/store';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebRTCAvatarProps {
    avatarId: string;
    streamId: string;
    className?: string;
    onSessionCreated?: (sessionId: string) => void;
}

export function WebRTCAvatar({ avatarId, streamId, className, onSessionCreated }: WebRTCAvatarProps) {
    const setAvatarSessionId = useStudioStore((state) => state.setAvatarSessionId);
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const [status, setStatus] = useState<'idle' | 'linking' | 'streaming' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (avatarId && streamId) {
            initStreaming();
        }

        return () => {
            closeConnection();
        };
    }, [avatarId, streamId]);

    const initStreaming = async () => {
        try {
            setStatus('linking');
            setError(null);

            // 1. Create session from backend (HeyGen)
            const response = await avatarApi.createSession(avatarId, streamId);
            if (!response.data || !response.data.session) {
                throw new Error(response.error || 'Failed to create avatar session');
            }

            const { session_id, sdp, ice_servers } = response.data.session;
            setAvatarSessionId(session_id);
            if (onSessionCreated) onSessionCreated(session_id);

            // 2. Initialize PeerConnection
            peerConnection.current = new RTCPeerConnection({
                iceServers: ice_servers.map(s => ({ urls: s.urls })),
            });

            // Handle incoming track
            peerConnection.current.ontrack = (event) => {
                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    setStatus('streaming');
                }
            };

            // 3. Handle SDP Offer from HeyGen
            await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: sdp })
            );

            // 4. Create local Answer
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            // 5. Start session with Answer
            const startRes = await avatarApi.startSession(session_id, answer.sdp!);
            if (startRes.error) {
                throw new Error(startRes.error);
            }

            // Connection strategy: HeyGen starts sending tracks after streaming.start

        } catch (err) {
            console.error('WebRTC Error:', err);
            setError(err instanceof Error ? err.message : 'Streaming failed');
            setStatus('error');
        }
    };

    const closeConnection = () => {
        setAvatarSessionId(null);
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    return (
        <div className={cn('relative bg-surface-400 rounded-xl overflow-hidden aspect-video', className)}>
            {/* Video Element */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={cn(
                    'w-full h-full object-cover transition-opacity duration-1000',
                    status === 'streaming' ? 'opacity-100' : 'opacity-0'
                )}
            />

            {/* Status Overlays */}
            {status === 'linking' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-400/80 backdrop-blur-sm">
                    <Loader2 size={32} className="text-accent-gold animate-spin mb-3" />
                    <p className="text-sm font-medium text-white/80">Connecting to AI Avatar...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-sm p-6 text-center">
                    <AlertCircle size={32} className="text-red-400 mb-3" />
                    <p className="text-sm font-medium text-red-300 mb-1">Connection Failed</p>
                    <p className="text-xs text-red-200/60 max-w-[200px]">{error}</p>
                    <button
                        onClick={initStreaming}
                        className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs text-red-300 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {status === 'idle' && !avatarId && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-500 italic">Select an avatar to start session</p>
                </div>
            )}
        </div>
    );
}
