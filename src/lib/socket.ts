'uyesse client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStudioStore } from '@/lib/store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(streamId?: string) {
    const socketRef = useRef<Socket | null>(null);
    const {
        addChatMessage,
        addGuest,
        removeGuest,
        updateGuestStatus,
        setAnalytics
    } = useStudioStore();

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            if (streamId) {
                socket.emit('stream:join', streamId);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        socket.on('chat:message', (message) => {
            addChatMessage({
                id: message.id || `msg-${Date.now()}`,
                platform: message.platform,
                username: message.username,
                message: message.message,
                timestamp: new Date(message.timestamp),
                highlighted: message.highlighted || false,
                donation: message.donation,
            });
        });

        socket.on('guest:joined', (data) => {
            addGuest({
                id: data.id || data.guestId,
                name: data.name,
                status: 'connected',
                videoEnabled: true,
                audioEnabled: true,
                connectionQuality: 'excellent',
            });
        });

        socket.on('guest:left', (data) => {
            removeGuest(data.id || data.guestId);
        });

        socket.on('stream:viewers', (data) => {
            // Update viewer count in store
            const store = useStudioStore.getState();
            if (store.stream) {
                store.setStream({
                    ...store.stream,
                    viewerCount: data.count,
                });
            }
        });

        socket.on('scene:switched', (data) => {
            const store = useStudioStore.getState();
            const scene = store.scenes.find(s => s.id === data.sceneId);
            if (scene) {
                store.setActiveScene(scene);
            }
        });

        // --- Guest WebRTC Signaling ---
        socket.on('guest:signal:offer', (data) => {
            // Handle incoming offer from guest (if we are the broadcaster)
            const event = new CustomEvent('guest-offer', { detail: data });
            window.dispatchEvent(event);
        });

        socket.on('guest:signal:answer', (data) => {
            // Handle incoming answer from broadcaster (if we are the guest)
            const event = new CustomEvent('guest-answer', { detail: data });
            window.dispatchEvent(event);
        });

        socket.on('guest:signal:ice', (data) => {
            // Handle incoming ICE candidate
            const event = new CustomEvent('guest-ice', { detail: data });
            window.dispatchEvent(event);
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [streamId, addChatMessage, addGuest, removeGuest]);

    // Emit functions
    const startStream = useCallback((platforms: string[]) => {
        if (socketRef.current && streamId) {
            socketRef.current.emit('stream:start', { streamId, platforms });
        }
    }, [streamId]);

    const stopStream = useCallback(() => {
        if (socketRef.current && streamId) {
            socketRef.current.emit('stream:stop', streamId);
        }
    }, [streamId]);

    const switchScene = useCallback((sceneId: string) => {
        if (socketRef.current && streamId) {
            socketRef.current.emit('scene:switch', { streamId, sceneId });
        }
    }, [streamId]);

    const speakWithAvatar = useCallback((text: string, avatarId: string) => {
        if (socketRef.current && streamId) {
            socketRef.current.emit('avatar:speak', { streamId, text, avatarId });
        }
    }, [streamId]);

    const sendChatMessage = useCallback((message: any) => {
        if (socketRef.current && streamId) {
            socketRef.current.emit('chat:message', { streamId, ...message });
        }
    }, [streamId]);

    // Signaling functions
    const sendOffer = useCallback((targetStreamId: string, offer: RTCSessionDescriptionInit, guestId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('guest:signal:offer', { streamId: targetStreamId, offer, guestId });
        }
    }, []);

    const sendAnswer = useCallback((targetSocketId: string, answer: RTCSessionDescriptionInit, guestId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('guest:signal:answer', { targetSocketId, answer, guestId });
        }
    }, []);

    const sendIceCandidate = useCallback((candidate: RTCIceCandidate, targetStreamId?: string, targetSocketId?: string, guestId?: string) => {
        if (socketRef.current) {
            socketRef.current.emit('guest:signal:ice', {
                streamId: targetStreamId,
                targetSocketId,
                candidate,
                guestId
            });
        }
    }, []);

    return {
        socket: socketRef.current,
        startStream,
        stopStream,
        switchScene,
        speakWithAvatar,
        sendChatMessage,
        sendOffer,
        sendAnswer,
        sendIceCandidate,
    };
}
