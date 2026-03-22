import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';
import prisma from '../config/database';
import { config } from '../config/environment';
import { UnauthorizedError, ConflictError, BadRequestError } from '../utils/errors';
import { JWTPayload } from '../middleware/auth';

/**
 * Authentication Service
 */
export class AuthService {
    /**
     * Register a new user
     */
    static async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        organizationId?: string;
        role?: UserRole;
    }) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                organizationId: data.organizationId,
                role: data.role || UserRole.VIEWER,
                status: 'PENDING',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                organizationId: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens(user);

        // Store refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        return {
            user,
            tokens: {
                accessToken,
                refreshToken,
            },
        };
    }

    /**
     * Login user
     */
    static async login(email: string, password: string) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Check if user is active
        if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
            throw new UnauthorizedError('Account is not active');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens(user);

        // Update user: store refresh token and last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken,
                lastLogin: new Date(),
            },
        });

        // Return user without password
        const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

        return {
            user: userWithoutSensitive,
            tokens: {
                accessToken,
                refreshToken,
            },
        };
    }

    /**
     * Refresh access token
     */
    static async refreshToken(refreshToken: string) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload;

            // Find user
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });

            if (!user || user.refreshToken !== refreshToken) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
                throw new UnauthorizedError('Account is not active');
            }

            // Generate new tokens
            const tokens = this.generateTokens(user);

            // Update refresh token
            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: tokens.refreshToken },
            });

            return tokens;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError('Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Logout user
     */
    static async logout(userId: string) {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    /**
     * Change password
     */
    static async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            throw new UnauthorizedError('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and invalidate refresh token
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                refreshToken: null,
            },
        });
    }

    /**
     * Generate JWT tokens
     */
    private static generateTokens(user: User) {
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId || undefined,
        };

        const accessToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });

        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn,
        });

        return { accessToken, refreshToken };
    }
}
