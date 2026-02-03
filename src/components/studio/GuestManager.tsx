'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video,
    Mic,
    MicOff,
    VideoOff,
    Phone,
    PhoneOff,
    Copy,
    Check,
    UserPlus,
    Users,
    Wifi,
    WifiOff,
    X,
    Mail,
    Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';
import { Guest } from '@/types';

interface GuestManagerProps {
    streamId: string;
    className?: string;
}

import { useSocket } from '@/lib/socket';

export function GuestManager({ streamId, className }: GuestManagerProps) {
    const { guests, addGuest, removeGuest, updateGuestStatus } = useStudioStore();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const { sendAnswer, sendIceCandidate } = useSocket(streamId);

    const handleInvite = async () => {
        if (!inviteName.trim()) return;
        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/guests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ streamId, name: inviteName, email: inviteEmail }),
            });

            const data = await res.json();
            if (data.guest) {
                // The backend emit will trigger guest:joined, but we also add it here for immediate feedback
                addGuest({
                    ...data.guest,
                    status: 'invited',
                    videoEnabled: true,
                    audioEnabled: true,
                });
                setInviteName('');
                setInviteEmail('');
                setShowInviteModal(false);
            }
        } catch (error) {
            console.error('Failed to invite guest:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveGuest = async (guestId: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guests/${guestId}`, {
                method: 'DELETE',
            });
            removeGuest(guestId);
        } catch (error) {
            console.error('Failed to remove guest:', error);
        }
    };

    const copyInviteLink = (guestId: string, code: string) => {
        const link = `${window.location.origin}/guest/join/${code}`;
        navigator.clipboard.writeText(link);
        setCopiedCode(guestId);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getStatusColor = (status: Guest['status']) => {
        switch (status) {
            case 'connected': return 'bg-green-500';
            case 'waiting': return 'bg-yellow-500';
            case 'invited': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getQualityIcon = (quality: Guest['connectionQuality']) => {
        switch (quality) {
            case 'excellent':
            case 'good':
                return <Wifi size={14} className="text-green-400" />;
            case 'fair':
                return <Wifi size={14} className="text-yellow-400" />;
            default:
                return <WifiOff size={14} className="text-red-400" />;
        }
    };

    return (
        <div className={cn('glass rounded-2xl p-4', className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Users size={18} className="text-accent-gold" />
                    Guests
                    {guests.length > 0 && (
                        <span className="text-xs bg-accent-burgundy/20 text-accent-gold px-2 py-0.5 rounded-full">
                            {guests.length}
                        </span>
                    )}
                </h3>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="p-2 rounded-lg bg-accent-gold/20 hover:bg-accent-gold/30 text-accent-gold transition-colors"
                    title="Invite Guest"
                >
                    <UserPlus size={16} />
                </button>
            </div>

            {/* Guest List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {guests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No guests yet</p>
                        <p className="text-xs">Invite guests to join your stream</p>
                    </div>
                ) : (
                    guests.map((guest) => (
                        <motion.div
                            key={guest.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-burgundy to-accent-gold flex items-center justify-center font-bold text-white">
                                    {guest.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={cn(
                                    'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-300',
                                    getStatusColor(guest.status)
                                )} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{guest.name}</span>
                                    {guest.status === 'connected' && getQualityIcon(guest.connectionQuality)}
                                </div>
                                <span className="text-xs text-gray-400 capitalize">{guest.status}</span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1">
                                {guest.status === 'connected' && (
                                    <>
                                        <button
                                            className={cn(
                                                'p-1.5 rounded-lg transition-colors',
                                                guest.audioEnabled
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            )}
                                            title={guest.audioEnabled ? 'Mute' : 'Unmute'}
                                        >
                                            {guest.audioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                                        </button>
                                        <button
                                            className={cn(
                                                'p-1.5 rounded-lg transition-colors',
                                                guest.videoEnabled
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            )}
                                            title={guest.videoEnabled ? 'Hide Video' : 'Show Video'}
                                        >
                                            {guest.videoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                                        </button>
                                    </>
                                )}
                                {guest.status === 'invited' && (
                                    <button
                                        onClick={() => copyInviteLink(guest.id, guest.id)}
                                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                        title="Copy Invite Link"
                                    >
                                        {copiedCode === guest.id ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleRemoveGuest(guest.id)}
                                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                    title="Remove Guest"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowInviteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass rounded-2xl p-6 w-full max-w-md m-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <UserPlus size={24} className="text-accent-gold" />
                                Invite Guest
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">Name *</label>
                                    <input
                                        type="text"
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        placeholder="Guest name"
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5">Email (optional)</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="guest@example.com"
                                            className="input-field pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteName.trim() || isLoading}
                                    className={cn(
                                        'flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                                        inviteName.trim() && !isLoading
                                            ? 'bg-accent-burgundy text-white hover:bg-accent-burgundy/80'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    )}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function GuestVideo({ guest, streamId }: { guest: Guest; streamId: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const { sendAnswer, sendIceCandidate } = useSocket(streamId);

    useEffect(() => {
        const handleOffer = async (e: any) => {
            const { offer, socketId } = e.detail;

            try {
                peerConnection.current = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                peerConnection.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendIceCandidate(event.candidate, undefined, socketId, guest.id);
                    }
                };

                peerConnection.current.ontrack = (event) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = event.streams[0];
                    }
                };

                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);

                sendAnswer(socketId, answer, guest.id);
            } catch (err) {
                console.error("Failed to handle guest offer:", err);
            }
        };

        const handleIce = async (e: any) => {
            const { candidate } = e.detail;
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const offerEvent = `signaling:offer:${guest.id}`;
        const iceEvent = `signaling:ice:${guest.id}`;

        window.addEventListener(offerEvent, handleOffer as EventListener);
        window.addEventListener(iceEvent, handleIce as EventListener);

        return () => {
            window.removeEventListener(offerEvent, handleOffer as EventListener);
            window.removeEventListener(iceEvent, handleIce as EventListener);
            if (peerConnection.current) peerConnection.current.close();
        };
    }, [guest.id, streamId, sendAnswer, sendIceCandidate]);

    return (
        <div className="relative aspect-video bg-surface-400 rounded-xl overflow-hidden shadow-lg border border-white/5">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    guest.status === 'connected' ? "opacity-100" : "opacity-0"
                )}
            />

            {guest.status !== 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-burgundy/20 to-accent-gold/20 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-burgundy to-accent-gold flex items-center justify-center font-bold text-2xl text-white mx-auto mb-2 shadow-neon-burgundy">
                            {guest.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs text-gray-400 animate-pulse">Waiting for connection...</p>
                    </div>
                </div>
            )}

            {/* Guest Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", guest.status === 'connected' ? "bg-green-500 animate-pulse" : "bg-gray-500")} />
                        <span className="text-sm font-semibold truncate text-white">{guest.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!guest.audioEnabled && <div className="p-1 rounded bg-red-500/20"><MicOff size={12} className="text-red-400" /></div>}
                        {!guest.videoEnabled && <div className="p-1 rounded bg-red-500/20"><VideoOff size={12} className="text-red-400" /></div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function GuestVideoGrid({ className, streamId }: { className?: string; streamId: string }) {
    const { guests } = useStudioStore();
    const visibleGuests = guests.filter(g => g.status === 'connected' || g.status === 'waiting');

    // Handle Signaling Redirection (Important for Overlay support)
    useEffect(() => {
        const handleOffer = async (e: any) => {
            const { offer, guestId, socketId } = e.detail;
            const event = new CustomEvent(`signaling:offer:${guestId}`, {
                detail: { offer, socketId }
            });
            window.dispatchEvent(event);
        };

        const handleIce = (e: any) => {
            const { candidate, guestId } = e.detail;
            const event = new CustomEvent(`signaling:ice:${guestId}`, {
                detail: { candidate }
            });
            window.dispatchEvent(event);
        };

        window.addEventListener('guest-offer', handleOffer as EventListener);
        window.addEventListener('guest-ice', handleIce as EventListener);

        return () => {
            window.removeEventListener('guest-offer', handleOffer as EventListener);
            window.removeEventListener('guest-ice', handleIce as EventListener);
        };
    }, []);

    if (visibleGuests.length === 0) return null;

    const gridCols = visibleGuests.length === 1 ? 1 : visibleGuests.length <= 4 ? 2 : 3;

    return (
        <div className={cn(
            'grid gap-3 transition-all duration-500',
            gridCols === 1 ? 'grid-cols-1' : gridCols === 2 ? 'grid-cols-2' : 'grid-cols-3',
            className
        )}>
            {visibleGuests.map((guest) => (
                <GuestVideo key={guest.id} guest={guest} streamId={streamId} />
            ))}
        </div>
    );
}
