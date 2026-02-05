import { Server as SocketIOServer } from 'socket.io';
import { getDatabase } from '../database';

export class NotificationService {
    private static instance: NotificationService;
    private db = getDatabase();
    private io: SocketIOServer | null = null;

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public setSocketServer(io: SocketIOServer) {
        this.io = io;
    }

    async send(params: {
        userId: string;
        type: 'info' | 'system' | 'payment' | 'security';
        title: string;
        message: string;
        link?: string;
    }) {
        try {
            // 1. Save to database for in-app notifications
            const notification = await (this.db.prisma as any).notification.create({
                data: params
            });

            // 2. Real-time broadcast if socket is connected
            if (this.io) {
                // Emit to specific user room if they are logged in
                this.io.to(`user:${params.userId}`).emit('notification', notification);

                // For critical security events, also log to console
                if (params.type === 'security') {
                    console.log(`[Security Alert] ${params.title}: ${params.message}`);
                }
            }

            // 3. Logic for Email (SendGrid) - Placeholder
            if (process.env.SENDGRID_API_KEY) {
                console.log(`[Email] Sending to user ${params.userId}: ${params.title}`);
                // Implementation would go here
            }

            return notification;
        } catch (error) {
            console.error('Notification failed:', error);
        }
    }

    async markAsRead(notificationId: string) {
        // @ts-ignore
        return await this.db.prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });
    }

    async getUserNotifications(userId: string) {
        // @ts-ignore
        return await this.db.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
}

export const getNotificationService = () => NotificationService.getInstance();
