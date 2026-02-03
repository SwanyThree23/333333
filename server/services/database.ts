import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://neondb_owner:npg_SqF9QZ5GVybz@ep-rough-term-afegxq9v-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
console.log('[Database] Connecting via pg:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class Database {
    public get prisma() {
        return prisma;
    }

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

    // Director operations
    async recordDirectorEvent(data: any) {
        return await (prisma as any).directorEvent.create({
            data: {
                ...data,
            }
        });
    }

    async getDirectorEvents(streamId: string, limit: number = 50) {
        return await (prisma as any).directorEvent.findMany({
            where: { streamId },
            orderBy: { timestamp: 'desc' },
            take: limit
        });
    }

    async updateStreamConfig(streamId: string, data: { aiDirectorEnabled?: boolean, latestAiInsights?: any }) {
        return await (prisma as any).stream.update({
            where: { id: streamId },
            data: data as any
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

    async disconnect() {
        await prisma.$disconnect();
        await pool.end();
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
