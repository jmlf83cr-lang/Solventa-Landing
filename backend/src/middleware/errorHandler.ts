import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config/environment';

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error
    logger.error('Error occurred:', {
        name: err.name,
        message: err.message,
        stack: config.isDevelopment ? err.stack : undefined,
        url: req.url,
        method: req.method,
    });

    // Operational errors (known errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                ...(err instanceof ValidationError && { errors: err.errors }),
            },
        });
    }

    // Zod validation errors
    if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.errors.forEach((error) => {
            const path = error.path.join('.');
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(error.message);
        });

        return res.status(422).json({
            success: false,
            error: {
                message: 'Validation failed',
                errors,
            },
        });
    }

    // Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (err.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Resource already exists',
                    field: (err.meta?.target as string[])?.[0],
                },
            });
        }

        // Record not found
        if (err.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Resource not found',
                },
            });
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid token',
            },
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Token expired',
            },
        });
    }

    // Default to 500 server error
    return res.status(500).json({
        success: false,
        error: {
            message: config.isProduction ? 'Internal server error' : err.message,
            ...(config.isDevelopment && { stack: err.stack }),
        },
    });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.url} not found`,
        },
    });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
