import { getOpenAIService, OpenAIService } from './openai';
import { getStreamService, StreamService } from './stream';
import { getDatabase } from './database';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export interface StreamEvent {
    type: 'chat' | 'donation' | 'viewer_milestone' | 'engagement_drop' | 'analytics';
    data: any;
    streamId: string;
}

export class AIDirectorService {
    private static instance: AIDirectorService;
    private openai: OpenAIService;
    private streamService: StreamService;
    private db = getDatabase();
    private io: SocketIOServer | null = null;

    private lastDecisionTime: Map<string, number> = new Map();
    private DECISION_COOLDOWN = 60000; // 1 minute minimum between major scene changes

    private constructor() {
        this.openai = getOpenAIService();
        this.streamService = getStreamService();
    }

    public static getInstance(): AIDirectorService {
        if (!AIDirectorService.instance) {
            AIDirectorService.instance = new AIDirectorService();
        }
        return AIDirectorService.instance;
    }

    public setSocketServer(io: SocketIOServer) {
        this.io = io;
    }

    /**
     * Process an incoming stream event and decide if action is needed
     */
    async handleEvent(event: StreamEvent) {
        const { streamId, type, data } = event;

        console.log(`[AI Director] Processing ${type} event for stream ${streamId}`);

        // 1. Immediate Action Rules (Rule-Based Overrides for zero latency)
        if (type === 'donation' && data.amount >= 50) {
            return this.triggerSceneEffect(streamId, 'Celebration', 'Big donation detected!');
        }

        // 2. Debounced AI Decisions
        const now = Date.now();
        const lastDecision = this.lastDecisionTime.get(streamId) || 0;

        if (now - lastDecision < this.DECISION_COOLDOWN && type !== 'engagement_drop') {
            return; // Stay on current scene to avoid "flickering"
        }

        // 3. AI Analysis
        if (type === 'chat' || type === 'engagement_drop') {
            await this.analyzeAndExecute(streamId, type);
        }
    }

    private broadcastChatMessage(streamId: string, message: string) {
        if (this.io) {
            this.io.to(streamId).emit('chat_message', {
                id: uuidv4(),
                username: 'AI_DIRECTOR',
                message,
                role: 'ai',
                timestamp: new Date().toISOString()
            });
        }
    }

    private async analyzeAndExecute(streamId: string, triggerType: string) {
        const startTime = Date.now();
        try {
            // Fetch real context from DB
            const dbMessages = await this.db.getChatMessages(streamId, 15);
            const chatMessages = dbMessages.map(m => m.message);

            const scenes = await this.db.getScenesByStreamId(streamId);
            const availableScenes = scenes.map(s => s.name);
            const activeSceneObj = scenes.find(s => s.isActive);
            const currentScene = activeSceneObj ? activeSceneObj.name : 'Unknown';

            if (availableScenes.length === 0) {
                console.warn(`[AI Director] No scenes found for stream ${streamId}`);
                return;
            }

            const suggestion = await this.openai.suggestSceneChange(
                currentScene,
                chatMessages,
                availableScenes
            );

            const latency = Date.now() - startTime;

            // Broadcast metrics to studio
            if (this.io) {
                this.io.to(`stream:${streamId}`).emit('director_metrics', {
                    latency,
                    confidence: suggestion?.confidence || 0,
                    trigger: triggerType
                });
            }

            if (suggestion && suggestion.confidence > 0.7 && suggestion.name !== currentScene) {
                console.log(`[AI Director] Decision: Switch to ${suggestion.name} (${suggestion.description})`);

                this.lastDecisionTime.set(streamId, Date.now());

                // Find the scene ID for the suggested scene
                const targetScene = scenes.find(s => s.name === suggestion.name);

                if (targetScene && this.io) {
                    // Update DB state
                    await this.db.setActiveScene(streamId, targetScene.id);

                    // Execute switch via socket
                    this.io.to(`stream:${streamId}`).emit('scene_change', {
                        sceneName: targetScene.name,
                        sceneId: targetScene.id,
                        reason: suggestion.description,
                        director: 'AI'
                    });

                    this.broadcastChatMessage(streamId, `🎬 Switching to ${suggestion.name}: ${suggestion.description}`);

                    // Record Director Event (for the persistent log)
                    await this.db.recordDirectorEvent({
                        streamId,
                        type: 'info',
                        message: `Switched to ${suggestion.name} because: ${suggestion.description}`,
                        metadata: {
                            confidence: suggestion.confidence,
                            suggestedBy: 'OpenAI',
                            latency
                        }
                    });

                    // Record in Audit Log (for compliance)
                    // @ts-ignore
                    await this.db.prisma.auditLog.create({
                        data: {
                            action: 'AI_DIRECTOR_SCENE_SWITCH',
                            metadata: {
                                description: `Switched to ${suggestion.name}`,
                                reason: suggestion.description,
                                latency
                            },
                            entity: 'stream',
                            entityId: streamId
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[AI Director] Analysis failed:', error);

            // Log failure event
            await this.db.recordDirectorEvent({
                streamId,
                type: 'error',
                message: `AI Analysis failed: ${(error as Error).message}`,
                metadata: { error: (error as Error).stack }
            }).catch(() => { });
        }
    }

    private triggerSceneEffect(streamId: string, effect: string, reason: string) {
        console.log(`[AI Director] Triggering ${effect}: ${reason}`);
        if (this.io) {
            this.io.to(streamId).emit('overlay_effect', { effect, reason });
            this.io.to(streamId).emit('scene_change', { sceneName: 'Hype Scene', reason, director: 'AI_RULE' });
        }
        this.broadcastChatMessage(streamId, `🎉 HYPE! ${reason}`);
    }
}

export const getAIDirectorService = () => AIDirectorService.getInstance();
