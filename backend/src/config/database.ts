import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Prisma Client instance
const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
    ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: any) => {
        logger.debug('Query:', {
            query: e.query,
            duration: `${e.duration}ms`,
        });
    });
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
});

export default prisma;
