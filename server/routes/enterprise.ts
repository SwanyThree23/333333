import express, { Router } from 'express';
import { getPaymentService } from '../services/enterprise/payment';
import { getNotificationService } from '../services/enterprise/notification';
import { getAuditService } from '../services/enterprise/audit';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../services/database';

const router = Router();
const paymentService = getPaymentService();
const notifyService = getNotificationService();
const auditService = getAuditService();
const db = getDatabase();

// --- Subscription Routes ---

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

// --- Stripe Webhook ---
// Note: express.raw needs to be used before other body parsers or specifically here
router.post('/webhook/stripe', express.json(), async (req, res) => {
    // In production, verify stripe signature using sig and req.body (raw)
    // For MVP/Testing, we use json
    try {
        await paymentService.handleWebhook(req.body);
        res.json({ received: true });
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err}`);
    }
});

// --- API Key Management ---

router.get('/keys', requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const keys = await db.prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
    res.json(keys);
});

router.post('/keys', requireAuth, validate(z.object({
    body: z.object({
        name: z.string().min(1)
    })
})), async (req, res) => {
    // @ts-ignore
    const userId = req.user.id;
    const { name } = req.body;
    const key = `sk_live_${uuidv4().replace(/-/g, '')}`;

    // @ts-ignore
    const apiKey = await db.prisma.apiKey.create({
        data: {
            userId,
            name,
            key,
            scopes: ['read:streams', 'write:streams']
        }
    });

    await auditService.log({
        userId,
        action: 'API_KEY_CREATED',
        entity: 'api_key',
        entityId: apiKey.id
    });

    res.json(apiKey);
});

router.delete('/keys/:id', requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    // @ts-ignore
    await db.prisma.apiKey.deleteMany({
        where: { id, userId }
    });

    await auditService.log({
        userId,
        action: 'API_KEY_DELETED',
        entity: 'api_key',
        entityId: id
    });

    res.json({ success: true });
});

// --- Notification Routes ---

router.get('/notifications', requireAuth, async (req, res) => {
    // @ts-ignore
    const userId = req.user.id;
    const notifications = await notifyService.getUserNotifications(userId);
    res.json(notifications);
});

router.post('/notifications/:id/read', requireAuth, async (req, res) => {
    // @ts-ignore
    await notifyService.markAsRead(req.params.id);
    res.json({ success: true });
});

// --- Admin & Audit Routes ---

router.get('/admin/stats', requireAuth, requireRole(['ADMIN']), async (req, res) => {
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
        database: await db.getStats()
    });
});

router.get('/admin/audit-logs', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    const logs = await auditService.getLogs();
    res.json(logs);
});

export default router;
