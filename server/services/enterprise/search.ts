import { getDatabase } from '../database';

export class SearchService {
    private static instance: SearchService;
    private db = getDatabase();

    private constructor() { }

    public static getInstance(): SearchService {
        if (!SearchService.instance) {
            SearchService.instance = new SearchService();
        }
        return SearchService.instance;
    }

    async searchStreams(query: string) {
        // @ts-ignore
        return await this.db.prisma.stream.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            },
            take: 20
        });
    }

    async searchUsers(query: string) {
        // @ts-ignore
        return await this.db.prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                image: true
            },
            take: 20
        });
    }
}

export const getSearchService = () => SearchService.getInstance();
