import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { morganStream } from './utils/logger';
import routes from './routes';
import { setupSwagger } from './docs/swagger';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
    const app = express();

    // Security middleware
    app.use(helmet());

    // Setup Swagger
    setupSwagger(app);

    // CORS configuration
    app.use(
        cors({
            origin: config.cors.origin,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    );

    // Request parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    app.use(compression());

    // HTTP request logging
    if (config.isDevelopment) {
        app.use(morgan('dev', { stream: morganStream }));
    } else {
        app.use(morgan('combined', { stream: morganStream }));
    }

    // Rate limiting
    const limiter = rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.maxRequests,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);

    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            success: true,
            data: {
                status: 'OK',
                timestamp: new Date().toISOString(),
                environment: config.env,
            },
        });
    });

    // API routes
    app.use(config.server.apiPrefix, routes);

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    return app;
};
