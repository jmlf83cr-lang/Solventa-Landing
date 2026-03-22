import { UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import bcrypt from 'bcryptjs';

/**
 * User Management Service
 */
export class UserService {
    static async getUsers(organizationId: string) {
        return prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getUserById(id: string, organizationId: string) {
        const user = await prisma.user.findFirst({
            where: { id, organizationId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                organizationId: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    static async createUser(data: {
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        organizationId: string;
        password?: string;
    }) {
        // Default password if not provided
        const password = data.password || 'Solventa2026!';
        const hashedPassword = await bcrypt.hash(password, 12);

        return prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                organizationId: data.organizationId,
                status: UserStatus.ACTIVE,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }

    static async updateUser(
        id: string,
        organizationId: string,
        data: {
            firstName?: string;
            lastName?: string;
            role?: UserRole;
            status?: UserStatus;
        }
    ) {
        // Verify user exists and belongs to the same organization
        await this.getUserById(id, organizationId);

        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });
    }

    static async deleteUser(id: string, organizationId: string) {
        const user = await this.getUserById(id, organizationId);

        // Prevent deleting the last admin of an organization (implement if needed)

        return prisma.user.delete({
            where: { id },
        });
    }
}
