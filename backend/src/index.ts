import { createApp } from './app';
import { config } from './config/environment';
import logger from './utils/logger';
import prisma from './config/database';

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ Database connected successfully');

        // Create Express app
        const app = createApp();

        // Start listening
        const server = app.listen(config.server.port, () => {
            logger.info(`🚀 Server running on port ${config.server.port}`);
            logger.info(`📝 Environment: ${config.env}`);
            logger.info(`🔗 API: http://localhost:${config.server.port}${config.server.apiPrefix}`);
            logger.info(`🏥 Health: http://localhost:${config.server.port}/health`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal: string) => {
            logger.info(`\n${signal} received, closing server gracefully...`);

            server.close(async () => {
                logger.info('Server closed');

                // Disconnect from database
                await prisma.$disconnect();
                logger.info('Database disconnected');

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
