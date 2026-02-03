import { getDatabase } from '../database';

export class NotificationService {
    private static instance: NotificationService;
    private db = getDatabase();

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
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
            // @ts-ignore
            const notification = await this.db.prisma.notification.create({
                data: params
            });

            // 2. Logic for Email (SendGrid) - Placeholder
            if (process.env.SENDGRID_API_KEY) {
                console.log(`[Email] Sending to user ${params.userId}: ${params.title}`);
                // Implementation would go here
            }

            // 3. Logic for Push (Firebase) - Placeholder
            if (process.env.FIREBASE_CONFIG) {
                console.log(`[Push] Sending to user ${params.userId}: ${params.title}`);
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
