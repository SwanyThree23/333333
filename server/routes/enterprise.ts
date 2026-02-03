import { Router } from 'express';
import { getPaymentService } from '../services/enterprise/payment';
import { getNotificationService } from '../services/enterprise/notification';
import { getAuditService } from '../services/enterprise/audit';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();
const paymentService = getPaymentService();
const notifyService = getNotificationService();
const auditService = getAuditService();

/**
 * @openapi
 * /api/enterprise/subscribe:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post('/subscribe', requireAuth, validate(z.object({
    body: z.object({
        planId: z.enum(['free', 'pro', 'enterprise'])
    })
})), async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { planId } = req.body;

        const subscription = await paymentService.createSubscription(userId, planId);

        await auditService.log({
            userId,
            action: 'SUBSCRIPTION_CREATED',
            entity: 'subscription',
            entityId: subscription.id,
            metadata: { planId }
        });

        await notifyService.send({
            userId,
            type: 'payment',
            title: 'Subscription Active',
            message: `You have successfully subscribed to the ${planId} plan.`
        });

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: 'Subscription failed' });
    }
});

/**
 * @openapi
 * /api/enterprise/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Users]
 */
router.get('/notifications', requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user.id;
    const notifications = await notifyService.getUserNotifications(userId);
    res.json(notifications);
});

/**
 * @openapi
 * /api/enterprise/admin/stats:
 *   get:
 *     summary: Get platform stats (Admin only)
 *     tags: [Admin]
 */
router.get('/admin/stats', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    // Audit admin access
    await auditService.log({
        // @ts-ignore
        userId: req.user.id,
        action: 'ADMIN_STATS_VIEW',
        entity: 'system'
    });

    res.json({
        platform: 'SwanyThree',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});

export default router;
