'use client';

import { useEffect, useRef } from 'react';
import { useStudioStore } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { toast } from 'sonner';

export function AIDirector() {
    const {
        aiDirectorEnabled,
        activeScene,
        scenes,
        setActiveScene,
        chatMessages,
        isStreaming,
        addDirectorLog,
        setDirectorLogs,
        setAiInsights,
        analytics,
        stream
    } = useStudioStore();

    const streamId = stream?.id;
    const { switchScene } = useSocket(streamId);

    const lastSuggestionTime = useRef<number>(0);
    const SUGGESTION_COOLDOWN = 60000; // 1 minute cooldown to avoid rapid switching

    // Load history on mount
    useEffect(() => {
        if (!streamId) return;

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/streams/${streamId}/director-events`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDirectorLogs(data.map((e: any) => ({
                        id: e.id,
                        timestamp: new Date(e.timestamp),
                        message: e.message,
                        type: e.type as any
                    })));
                }
            })
            .catch(console.error);
    }, [streamId, setDirectorLogs]);

    useEffect(() => {
        if (!aiDirectorEnabled || !isStreaming) return;

        const checkForSceneChange = async () => {
            const now = Date.now();
            if (now - lastSuggestionTime.current < SUGGESTION_COOLDOWN) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ai/suggest-scene`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentScene: activeScene?.name || 'none',
                        chatHistory: chatMessages.slice(-20).map(m => `${m.username}: ${m.message}`),
                        availableScenes: scenes.map(s => s.name)
                    })
                });

                if (!response.ok) return;

                const suggestion = await response.json();

                if (suggestion && suggestion.confidence > 0.7) {
                    const nextScene = scenes.find(s => s.name === suggestion.name);

                    if (nextScene && nextScene.id !== activeScene?.id) {
                        toast.info(`AI Director: Switching to ${nextScene.name}`, {
                            description: suggestion.description
                        });
                        addDirectorLog({
                            message: `Auto-switched to ${nextScene.name}: ${suggestion.description}`,
                            type: 'success'
                        });

                        // Persist to backend
                        if (streamId) {
                            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/streams/${streamId}/director-events`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'success',
                                    message: `Auto-switched to ${nextScene.name}: ${suggestion.description}`,
                                    metadata: suggestion
                                })
                            }).catch(console.error);
                        }

                        // Use socket to switch scene (broadcasts to all clients)
                        switchScene(nextScene.id);

                        lastSuggestionTime.current = Date.now();
                    }
                }
            } catch (error) {
                console.error("AI Director failed to get suggestion:", error);
            }
        };

        const fetchInsights = async () => {
            if (!analytics?.viewerTimeline) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ai/analyze-engagement`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        streamId,
                        viewerCount: analytics.viewerTimeline.map(t => t.count),
                        chatActivity: [chatMessages.length],
                        sceneChanges: []
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setAiInsights(data.insights);
                }
            } catch (error) {
                console.error("Failed to fetch AI insights:", error);
            }
        };

        const interval = setInterval(checkForSceneChange, 30000);
        const insightInterval = setInterval(fetchInsights, 120000); // Every 2 mins

        return () => {
            clearInterval(interval);
            clearInterval(insightInterval);
        };
    }, [aiDirectorEnabled, isStreaming, activeScene, scenes, chatMessages, setActiveScene, addDirectorLog, setAiInsights, analytics, streamId, switchScene]);

    return null; // Invisible manager component
}
