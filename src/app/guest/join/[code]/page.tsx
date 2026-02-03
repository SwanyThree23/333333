'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Settings, Camera, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket';

export default function GuestJoinPage() {
    const { code } = useParams();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);

    const [status, setStatus] = useState<'preview' | 'joining' | 'connected' | 'error'>('preview');
    const [guest, setGuest] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { sendOffer, sendIceCandidate } = useSocket(guest?.streamId);

    // Initial check of the code
    useEffect(() => {
        const checkInvite = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/guests/join/${code}`, {
                    method: 'POST'
                });
                const data = await res.json();

                if (data.error) {
                    setError(data.error);
                    setStatus('error');
                    return;
                }

                setGuest(data.guest);
            } catch (err) {
                setError('Failed to connect to server');
                setStatus('error');
            }
        };

        if (code) checkInvite();
    }, [code]);

    // Setup local camera preview
    useEffect(() => {
        if (status === 'preview' && videoRef.current) {
            navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            })
                .then(stream => {
                    localStream.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Could not access camera:", err);
                    setError("Camera/Microphone access is required to join the stream.");
                });
        }

        return () => {
            if (status === 'preview' && localStream.current) {
                localStream.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [status]);

    // Handle Signaling
    useEffect(() => {
        const handleAnswer = async (e: any) => {
            const { answer, guestId } = e.detail;
            if (guestId === guest?.id && peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                setStatus('connected');
            }
        };

        const handleIce = async (e: any) => {
            const { candidate, guestId } = e.detail;
            if (guestId === guest?.id && peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        window.addEventListener('guest-answer', handleAnswer as EventListener);
        window.addEventListener('guest-ice', handleIce as EventListener);

        return () => {
            window.removeEventListener('guest-answer', handleAnswer as EventListener);
            window.removeEventListener('guest-ice', handleIce as EventListener);
        };
    }, [guest]);

    const handleJoin = async () => {
        if (!guest || !localStream.current) return;

        setStatus('joining');

        try {
            // 1. Create PeerConnection
            peerConnection.current = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // 2. Add local tracks
            localStream.current.getTracks().forEach(track => {
                peerConnection.current?.addTrack(track, localStream.current!);
            });

            // 3. Handle ICE candidates
            peerConnection.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                if (event.candidate) {
                    sendIceCandidate(event.candidate, guest.streamId, undefined, guest.id);
                }
            };

            // 4. Create offer
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            // 5. Send offer to broadcaster
            sendOffer(guest.streamId, offer, guest.id);

        } catch (err) {
            console.error("WebRTC Error:", err);
            setError("Failed to establish secure connection.");
            setStatus('error');
        }
    };

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-surface-500 flex items-center justify-center p-6 text-white">
                <div className="glass max-w-md w-full p-8 text-center rounded-3xl border border-red-500/20">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
                    <p className="text-gray-400 mb-6">{error || 'This invite code is invalid or has expired.'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-500 flex items-center justify-center p-6 text-white">
            <AnimatePresence mode="wait">
                {status === 'preview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="glass max-w-xl w-full p-8 rounded-3xl"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-accent-burgundy to-accent-gold bg-clip-text text-transparent">
                                Ready to join?
                            </h1>
                            <p className="text-gray-400">You've been invited by {guest?.streamId ? 'Broadcaster' : '...'}</p>
                        </div>

                        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-2xl group">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
                            />
                            {isVideoOff && (
                                <div className="absolute inset-0 flex items-center justify-center bg-surface-400">
                                    <Camera size={48} className="text-gray-500 opacity-20" />
                                </div>
                            )}

                            {/* Controls Overlay */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={cn(
                                        "p-4 rounded-2xl backdrop-blur-md transition-all",
                                        isMuted ? "bg-red-500/80 text-white" : "bg-black/40 text-white hover:bg-black/60"
                                    )}
                                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                                    aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                                >
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <button
                                    onClick={() => setIsVideoOff(!isVideoOff)}
                                    className={cn(
                                        "p-4 rounded-2xl backdrop-blur-md transition-all",
                                        isVideoOff ? "bg-red-500/80 text-white" : "bg-black/40 text-white hover:bg-black/60"
                                    )}
                                    title={isVideoOff ? "Start Camera" : "Stop Camera"}
                                    aria-label={isVideoOff ? "Start Camera" : "Stop Camera"}
                                >
                                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                                <button
                                    className="p-4 rounded-2xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
                                    title="Camera & Audio Settings"
                                    aria-label="Camera & Audio Settings"
                                >
                                    <Settings size={20} />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleJoin}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-burgundy to-accent-gold text-white font-bold text-lg shadow-neon-burgundy hover:shadow-neon-gold transition-all flex items-center justify-center gap-3"
                        >
                            <Sparkles size={20} />
                            Join Stream
                        </button>
                    </motion.div>
                )}

                {status === 'joining' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <Loader2 size={64} className="text-accent-gold animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Connecting to Studio...</h2>
                        <p className="text-gray-400">Negotiating WebRTC session</p>
                    </motion.div>
                )}

                {status === 'connected' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass max-w-md w-full p-12 rounded-3xl text-center"
                    >
                        <CheckCircle2 size={64} className="text-green-400 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold mb-2">You're In!</h2>
                        <p className="text-gray-400 mb-8">You are now broadcasting to the studio. Break a leg!</p>
                        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
                            Always keep this tab open during the stream.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Decorations */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent-gold/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-burgundy/10 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
