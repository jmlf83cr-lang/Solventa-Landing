import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    organizationId: z.string().uuid().optional(),
    role: z.nativeEnum(UserRole).optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * Authentication Controller
 */
export class AuthController {
    /**
     * Register a new user
     * POST /api/auth/register
     */
    static register = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = registerSchema.parse(req.body);

        const result = await AuthService.register(validatedData);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    });

    /**
     * Login user
     * POST /api/auth/login
     */
    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = loginSchema.parse(req.body);

        const result = await AuthService.login(email, password);

        res.json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    });

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    static refresh = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = refreshTokenSchema.parse(req.body);

        const tokens = await AuthService.refreshToken(refreshToken);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokens,
        });
    });

    /**
     * Logout user
     * POST /api/auth/logout
     */
    static logout = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authenticated' },
            });
        }

        await AuthService.logout(req.user.userId);

        res.json({
            success: true,
            message: 'Logout successful',
        });
    });

    /**
     * Change password
     * POST /api/auth/change-password
     */
    static changePassword = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authenticated' },
            });
        }

        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        await AuthService.changePassword(req.user.userId, currentPassword, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    });

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    static getProfile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authenticated' },
            });
        }

        res.json({
            success: true,
            data: req.user,
        });
    });
}
