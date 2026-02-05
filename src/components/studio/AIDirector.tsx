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
        isStreaming,
        addDirectorLog,
        setDirectorLogs,
        setAiInsights,
        setAiMetrics,
        stream
    } = useStudioStore();

    const streamId = stream?.id;
    const { socket } = useSocket(streamId);

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

    // Handle Socket Events from the backend Director
    useEffect(() => {
        if (!socket || !streamId || !aiDirectorEnabled) return;

        const onSceneChange = (data: { sceneName: string, sceneId: string, reason: string, director: string }) => {
            if (data.director === 'AI' || data.director === 'AI_RULE') {
                const targetScene = scenes.find(s => s.id === data.sceneId || s.name === data.sceneName);
                if (targetScene && targetScene.id !== activeScene?.id) {
                    setActiveScene(targetScene);

                    toast.info(`AI Director: Switching to ${targetScene.name}`, {
                        description: data.reason
                    });

                    addDirectorLog({
                        message: `Auto-switched to ${targetScene.name}: ${data.reason}`,
                        type: 'success'
                    });
                }
            }
        };

        const onDirectorMetrics = (data: { latency: number, confidence: number, trigger: string }) => {
            setAiMetrics(data.latency, data.confidence);
        };

        socket.on('scene_change', onSceneChange);
        socket.on('director_metrics', onDirectorMetrics);

        return () => {
            socket.off('scene_change', onSceneChange);
            socket.off('director_metrics', onDirectorMetrics);
        };
    }, [socket, streamId, aiDirectorEnabled, scenes, activeScene, setActiveScene, addDirectorLog, setAiMetrics]);

    // Engagement analysis is still useful to poll occasionally for insights
    useEffect(() => {
        if (!aiDirectorEnabled || !isStreaming || !streamId) return;

        const fetchInsights = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ai/analyze-engagement`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ streamId })
                });

                if (response.ok) {
                    const data = await response.json();
                    setAiInsights(data.insights);
                }
            } catch (error) {
                console.error("Failed to fetch AI insights:", error);
            }
        };

        const insightInterval = setInterval(fetchInsights, 120000); // Every 2 mins
        fetchInsights();

        return () => clearInterval(insightInterval);
    }, [aiDirectorEnabled, isStreaming, streamId, setAiInsights]);

    return null;
}
