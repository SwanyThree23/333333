import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../services/database';

const db = getDatabase() as any;

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // In a real app, verify JWT here. 
        // For this MVP, we might check for a session or API key.

        // Check for API Key if applicable
        const apiKey = await db.prisma.apiKey.findUnique({
            where: { key: token },
            include: { user: true }
        });

        if (apiKey) {
            if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
                return res.status(401).json({ error: 'API Key expired' });
            }

            // @ts-ignore
            req.user = apiKey.user;
            // @ts-ignore
            req.apiKey = apiKey;
            return next();
        }

        // Check for session token (Next-Auth style if shared DB)
        const session = await db.prisma.session.findUnique({
            where: { sessionToken: token },
            include: { user: true }
        });

        if (session) {
            if (session.expires < new Date()) {
                return res.status(401).json({ error: 'Session expired' });
            }
            // @ts-ignore
            req.user = session.user;
            return next();
        }

        return res.status(401).json({ error: 'Invalid token' });
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // @ts-ignore
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: Requires ${roles.join(' or ')} role` });
        }

        next();
    };
};
