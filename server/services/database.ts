/**
 * Database Service backed by Prisma & Neon
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Re-exporting prisma client for the server
const prisma = new PrismaClient();

export class Database {
    // User operations
    async createUser(data: any) {
        return await prisma.user.create({ data });
    }

    async getUserById(id: string) {
        return await prisma.user.findUnique({ where: { id } });
    }

    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({ where: { email } });
    }

    // Stream operations
    async createStream(data: any) {
        const { userId, ...rest } = data;
        return await prisma.stream.create({
            data: {
                ...rest,
                user: { connect: { id: userId } }
            }
        });
    }

    async getStreamById(id: string) {
        return await prisma.stream.findUnique({
            where: { id },
            include: { platforms: true, scenes: true, chatMessages: true, guests: true }
        });
    }

    async getStreamsByUserId(userId: string) {
        return await prisma.stream.findMany({ where: { userId } });
    }

    async updateStream(id: string, data: any) {
        return await prisma.stream.update({
            where: { id },
            data
        });
    }

    async getLiveStreams() {
        return await prisma.stream.findMany({ where: { status: 'live' } });
    }

    // Chat operations
    async addChatMessage(data: any) {
        return await prisma.chatMessage.create({
            data: {
                ...data,
            }
        });
    }

    async getChatMessages(streamId: string, limit: number = 100) {
        return await prisma.chatMessage.findMany({
            where: { streamId },
            orderBy: { timestamp: 'desc' },
            take: limit
        });
    }

    // Guest operations
    async createGuest(data: any) {
        return await prisma.guest.create({
            data: {
                ...data,
                inviteCode: this.generateInviteCode()
            }
        });
    }

    async getGuestsByStreamId(streamId: string) {
        return await prisma.guest.findMany({ where: { streamId } });
    }

    async getGuestByInviteCode(inviteCode: string) {
        return await prisma.guest.findUnique({ where: { inviteCode } });
    }

    async updateGuestStatus(id: string, status: string) {
        return await prisma.guest.update({
            where: { id },
            data: { status }
        });
    }

    // Scene operations
    async createScene(data: any) {
        return await prisma.scene.create({ data });
    }

    async getScenesByStreamId(streamId: string) {
        return await prisma.scene.findMany({
            where: { streamId },
            orderBy: { order: 'asc' }
        });
    }

    async setActiveScene(streamId: string, sceneId: string) {
        await prisma.scene.updateMany({
            where: { streamId },
            data: { isActive: false }
        });
        return await prisma.scene.update({
            where: { id: sceneId },
            data: { isActive: true }
        });
    }

    // Avatar session operations
    async createAvatarSession(data: any) {
        return await prisma.avatarSession.create({ data });
    }

    async getAvatarSession(streamId: string) {
        return await prisma.avatarSession.findFirst({
            where: { streamId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateAvatarStatus(sessionId: string, status: string) {
        return await prisma.avatarSession.update({
            where: { id: sessionId },
            data: { status }
        });
    }

    // Analytics operations
    async recordAnalytics(data: any) {
        return await prisma.analytics.create({
            data: {
                ...data,
                platformData: data.platformBreakdown || {}
            }
        });
    }

    async getAnalytics(streamId: string) {
        return await prisma.analytics.findMany({
            where: { streamId },
            orderBy: { timestamp: 'asc' }
        });
    }

    async getLatestAnalytics(streamId: string) {
        return await prisma.analytics.findFirst({
            where: { streamId },
            orderBy: { timestamp: 'desc' }
        });
    }

    // Utility
    private generateInviteCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async getStats() {
        const counts = await Promise.all([
            prisma.user.count(),
            prisma.stream.count(),
            prisma.chatMessage.count(),
            prisma.guest.count()
        ]);
        return {
            users: counts[0],
            streams: counts[1],
            chatMessages: counts[2],
            guests: counts[3]
        };
    }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
    if (!dbInstance) {
        dbInstance = new Database();
    }
    return dbInstance;
}
