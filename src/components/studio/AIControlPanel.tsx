'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Mic,
    Send,
    RefreshCw,
    Brain,
    Wand2,
    MessageSquare,
    Volume2,
    Settings2,
    ChevronDown,
    Check,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';
import { toast } from 'sonner';
import { avatarApi, aiApi, Avatar, Voice } from '@/lib/api';

interface AIControlPanelProps {
    streamId?: string;
    className?: string;
}

export function AIControlPanel({ streamId, className }: AIControlPanelProps) {
    const [activeTab, setActiveTab] = useState<'speak' | 'script' | 'respond' | 'director'>('speak');
    const { aiDirectorEnabled, setAiDirectorEnabled } = useStudioStore();
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Avatar state
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
    const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);

    // Voice state
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
    const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
    const [voiceProvider, setVoiceProvider] = useState<'heygen' | 'elevenlabs'>('elevenlabs');

    // Script generation
    const [scriptTopic, setScriptTopic] = useState('');
    const [scriptStyle, setScriptStyle] = useState('professional');
    const [generatedScript, setGeneratedScript] = useState('');

    // Chat response
    const [chatQuestion, setChatQuestion] = useState('');
    const [chatResponse, setChatResponse] = useState('');

    // Load avatars and voices
    const avatarSessionId = useStudioStore((state) => state.avatarSessionId);

    useEffect(() => {
        loadAvatars();
        loadVoices();
    }, []);

    async function loadAvatars() {
        const { data } = await avatarApi.list();
        if (data) {
            setAvatars(data);
            if (data.length > 0) setSelectedAvatar(data[0]);
        }
    }

    async function loadVoices() {
        const { data } = await avatarApi.listVoices();
        if (data) {
            const allVoices = [...data.heygen, ...data.elevenlabs];
            setVoices(allVoices);
            if (data.elevenlabs.length > 0) setSelectedVoice(data.elevenlabs[0]);
        }
    }

    async function handleSpeak() {
        if (!text.trim() || !selectedAvatar) return;

        setIsSpeaking(true);

        try {
            const { data } = await avatarApi.speak({
                sessionId: avatarSessionId || 'demo-session',
                streamId: streamId || 'demo-stream',
                text,
                voiceId: selectedVoice?.voice_id,
                useElevenLabs: voiceProvider === 'elevenlabs',
            });

            if (data?.duration) {
                setTimeout(() => {
                    setIsSpeaking(false);
                    setText('');
                }, data.duration);
            } else {
                setIsSpeaking(false);
            }
        } catch (error) {
            setIsSpeaking(false);
        }
    }

    async function handleGenerateScript() {
        if (!scriptTopic.trim()) return;

        setIsProcessing(true);

        try {
            const { data } = await aiApi.generateScript(scriptTopic, scriptStyle, 60);
            if (data?.script) {
                setGeneratedScript(data.script);
            }
        } catch (error) {
            console.error('Failed to generate script:', error);
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleGetChatResponse() {
        if (!chatQuestion.trim()) return;

        setIsProcessing(true);

        try {
            const { data } = await aiApi.getChatResponse(
                chatQuestion,
                'AI Avatar Livestream Demo',
                []
            );
            if (data?.response) {
                setChatResponse(data.response);
            }
        } catch (error) {
            console.error('Failed to get response:', error);
        } finally {
            setIsProcessing(false);
        }
    }

    function useScriptAsText() {
        setText(generatedScript);
        setActiveTab('speak');
    }

    function useResponseAsText() {
        setText(chatResponse);
        setActiveTab('speak');
    }

    return (
        <div className={cn('glass rounded-2xl overflow-hidden', className)}>
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-burgundy/30 to-accent-gold/30 flex items-center justify-center">
                        <Brain size={20} className="text-accent-gold" />
                    </div>
                    <div>
                        <h3 className="font-semibold">AI Control Center</h3>
                        <p className="text-xs text-gray-400">
                            Avatar speech, scripts, & chat responses
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {[
                    { id: 'speak', icon: <Mic size={16} />, label: 'Speak' },
                    { id: 'script', icon: <Wand2 size={16} />, label: 'Script' },
                    { id: 'respond', icon: <MessageSquare size={16} />, label: 'Respond' },
                    { id: 'director', icon: <Sparkles size={16} />, label: 'Director' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            'flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all duration-200',
                            activeTab === tab.id
                                ? 'text-white bg-white/10'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        )}
                    >
                        {tab.icon}
                        <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Avatar & Voice Selection (shown on speak tab) */}
                {activeTab === 'speak' && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Avatar Selector */}
                            <div className="relative">
                                <label className="block text-xs text-gray-400 mb-1.5">Avatar</label>
                                <button
                                    onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-surface-300 border border-white/10 text-left flex items-center justify-between"
                                >
                                    <span className="text-sm truncate">
                                        {selectedAvatar?.avatar_name || 'Select Avatar'}
                                    </span>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>

                                <AnimatePresence>
                                    {showAvatarDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-surface-200 border border-white/10 rounded-xl overflow-hidden z-50"
                                        >
                                            {avatars.map((avatar) => (
                                                <button
                                                    key={avatar.avatar_id}
                                                    onClick={() => {
                                                        setSelectedAvatar(avatar);
                                                        setShowAvatarDropdown(false);
                                                    }}
                                                    className={cn(
                                                        'w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-white/10',
                                                        selectedAvatar?.avatar_id === avatar.avatar_id && 'bg-white/5'
                                                    )}
                                                >
                                                    <span>{avatar.avatar_name}</span>
                                                    {selectedAvatar?.avatar_id === avatar.avatar_id && (
                                                        <Check size={14} className="text-accent-gold" />
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Voice Selector */}
                            <div className="relative">
                                <label className="block text-xs text-gray-400 mb-1.5">Voice</label>
                                <button
                                    onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-surface-300 border border-white/10 text-left flex items-center justify-between"
                                >
                                    <span className="text-sm truncate">
                                        {selectedVoice?.name || 'Select Voice'}
                                    </span>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>

                                <AnimatePresence>
                                    {showVoiceDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-surface-200 border border-white/10 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                                        >
                                            {voices.map((voice) => (
                                                <button
                                                    key={voice.voice_id}
                                                    onClick={() => {
                                                        setSelectedVoice(voice);
                                                        setShowVoiceDropdown(false);
                                                    }}
                                                    className={cn(
                                                        'w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-white/10',
                                                        selectedVoice?.voice_id === voice.voice_id && 'bg-white/5'
                                                    )}
                                                >
                                                    <div>
                                                        <span>{voice.name}</span>
                                                        <span className="text-xs text-gray-400 ml-2">
                                                            {voice.gender}
                                                        </span>
                                                    </div>
                                                    {selectedVoice?.voice_id === voice.voice_id && (
                                                        <Check size={14} className="text-accent-gold" />
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Voice Provider Toggle */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Provider:</span>
                            <div className="flex rounded-lg bg-surface-400 p-0.5">
                                <button
                                    onClick={() => setVoiceProvider('elevenlabs')}
                                    className={cn(
                                        'px-3 py-1 text-xs rounded-md transition-colors',
                                        voiceProvider === 'elevenlabs'
                                            ? 'bg-accent-burgundy text-white'
                                            : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    ElevenLabs
                                </button>
                                <button
                                    onClick={() => setVoiceProvider('heygen')}
                                    className={cn(
                                        'px-3 py-1 text-xs rounded-md transition-colors',
                                        voiceProvider === 'heygen'
                                            ? 'bg-accent-gold text-white'
                                            : 'text-gray-400 hover:text-white'
                                    )}
                                >
                                    HeyGen
                                </button>
                            </div>
                        </div>

                        {/* Text Input */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                                Text to Speak
                            </label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Enter text for the avatar to speak..."
                                className="input-field min-h-[100px] resize-none"
                                disabled={isSpeaking}
                            />
                        </div>

                        {/* Speak Button */}
                        <button
                            onClick={handleSpeak}
                            disabled={!text.trim() || !selectedAvatar || isSpeaking}
                            className={cn(
                                'w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2',
                                text.trim() && selectedAvatar && !isSpeaking
                                    ? 'bg-gradient-to-r from-accent-burgundy to-accent-gold text-white hover:shadow-neon-gold'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            )}
                        >
                            {isSpeaking ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Speaking...
                                </>
                            ) : (
                                <>
                                    <Volume2 size={18} />
                                    Speak Now
                                </>
                            )}
                        </button>
                    </>
                )}

                {/* Script Generator Tab */}
                {activeTab === 'script' && (
                    <>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Topic</label>
                            <input
                                type="text"
                                value={scriptTopic}
                                onChange={(e) => setScriptTopic(e.target.value)}
                                placeholder="What should the avatar talk about?"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Style</label>
                            <select
                                value={scriptStyle}
                                onChange={(e) => setScriptStyle(e.target.value)}
                                className="input-field"
                                title="Script Style"
                            >
                                <option value="professional">Professional</option>
                                <option value="casual">Casual & Friendly</option>
                                <option value="educational">Educational</option>
                                <option value="entertaining">Entertaining</option>
                                <option value="inspiring">Inspiring</option>
                            </select>
                        </div>

                        <button
                            onClick={handleGenerateScript}
                            disabled={!scriptTopic.trim() || isProcessing}
                            className={cn(
                                'w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2',
                                scriptTopic.trim() && !isProcessing
                                    ? 'bg-accent-burgundy text-white hover:bg-accent-burgundy/80'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            )}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 size={18} />
                                    Generate Script
                                </>
                            )}
                        </button>

                        {generatedScript && (
                            <div className="mt-4">
                                <label className="block text-xs text-gray-400 mb-1.5">
                                    Generated Script
                                </label>
                                <div className="p-4 rounded-xl bg-surface-400 text-sm whitespace-pre-wrap">
                                    {generatedScript}
                                </div>
                                <button
                                    onClick={useScriptAsText}
                                    className="mt-2 w-full py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                                >
                                    Use This Script
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Chat Response Tab */}
                {activeTab === 'respond' && (
                    <>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                                Viewer Question
                            </label>
                            <input
                                type="text"
                                value={chatQuestion}
                                onChange={(e) => setChatQuestion(e.target.value)}
                                placeholder="Enter a viewer's question..."
                                className="input-field"
                            />
                        </div>

                        <button
                            onClick={handleGetChatResponse}
                            disabled={!chatQuestion.trim() || isProcessing}
                            className={cn(
                                'w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2',
                                chatQuestion.trim() && !isProcessing
                                    ? 'bg-accent-gold text-white hover:bg-accent-gold/80'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            )}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Thinking...
                                </>
                            ) : (
                                <>
                                    <Brain size={18} />
                                    Generate Response
                                </>
                            )}
                        </button>

                        {chatResponse && (
                            <div className="mt-4">
                                <label className="block text-xs text-gray-400 mb-1.5">
                                    AI Response
                                </label>
                                <div className="p-4 rounded-xl bg-surface-400 text-sm">
                                    {chatResponse}
                                </div>
                                <button
                                    onClick={useResponseAsText}
                                    className="mt-2 w-full py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                                >
                                    Speak This Response
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Director Tab */}
                {activeTab === 'director' && (
                    <div className="space-y-6 py-2">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-400 border border-white/5">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-white flex items-center gap-2">
                                    <Sparkles size={16} className="text-accent-gold" />
                                    Auto-Director Mode
                                </h4>
                                <p className="text-xs text-gray-400 max-w-[200px]">
                                    AI will automatically switch scenes based on chat engagement and stream context.
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    const nextState = !aiDirectorEnabled;
                                    setAiDirectorEnabled(nextState);
                                    if (streamId) {
                                        try {
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/streams/${streamId}/config`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ aiDirectorEnabled: nextState })
                                            });
                                        } catch (error) {
                                            console.error('Failed to sync director state:', error);
                                        }
                                    }
                                }}
                                title={aiDirectorEnabled ? "Disable AI Director" : "Enable AI Director"}
                                className={cn(
                                    "relative w-12 h-6 rounded-full transition-colors duration-300",
                                    aiDirectorEnabled ? "bg-accent-gold" : "bg-gray-700"
                                )}
                            >
                                <motion.div
                                    animate={{ x: aiDirectorEnabled ? 26 : 4 }}
                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">How it works</h4>
                            <div className="grid gap-3">
                                {[
                                    { title: 'Engagement Analysis', desc: 'Monitors chat velocity and sentiment.' },
                                    { title: 'Contextual Switching', desc: 'Detects topics and switches to relevant layouts.' },
                                    { title: 'Smart Cooldown', desc: 'Prevents rapid switches for a professional feel.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5">
                                        <div className="w-6 h-6 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold text-xs font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-200">{item.title}</p>
                                            <p className="text-xs text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Simulate Lab</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={async () => {
                                        try {
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/test/director/event`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    type: 'donation',
                                                    data: { amount: 100, user: 'BigSpender' },
                                                    streamId
                                                })
                                            });
                                            toast.success('Simulation: $100 Donation Event Sent');
                                        } catch (err) {
                                            toast.error('Simulation failed');
                                        }
                                    }}
                                    className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
                                >
                                    Simulate $100 Tip
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/test/director/event`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    type: 'chat',
                                                    data: { message: 'Show us the code!' },
                                                    streamId
                                                })
                                            });
                                            toast.success('Simulation: Contextual Chat Sent');
                                        } catch (err) {
                                            toast.error('Simulation failed');
                                        }
                                    }}
                                    className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all"
                                >
                                    Force Scene Analysis
                                </button>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-accent-burgundy/10 border border-accent-burgundy/20 text-xs text-accent-burgundy">
                            <strong>Note:</strong> Auto-Director requires an active stream to function correctly.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
