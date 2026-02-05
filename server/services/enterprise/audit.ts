import { getDatabase } from '../database';

export class AuditService {
    private static instance: AuditService;
    private db = getDatabase();

    private constructor() { }

    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    async log(params: {
        userId?: string;
        action: string;
        entity: string;
        entityId?: string;
        metadata?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
        try {
            // @ts-ignore - prisma is on the instance
            await this.db.prisma.auditLog.create({
                data: {
                    ...params,
                    metadata: params.metadata || {}
                }
            });
        } catch (error) {
            console.error('Audit Log failed:', error);
        }
    }

    async getLogs(limit = 50, offset = 0) {
        // @ts-ignore
        return await this.db.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: { user: { select: { name: true, email: true } } }
        });
    }
}

export const getAuditService = () => AuditService.getInstance();
