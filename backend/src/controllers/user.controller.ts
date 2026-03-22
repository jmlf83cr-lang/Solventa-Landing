import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../middleware/errorHandler';
import { UnauthorizedError } from '../utils/errors';
import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

const createUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.nativeEnum(UserRole),
    password: z.string().min(8).optional(),
});

const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
});

/**
 * User Management Controller
 */
export class UserController {
    static getUsers = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        const users = await UserService.getUsers(orgId);
        res.json({ success: true, data: users });
    });

    static getUserById = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        const user = await UserService.getUserById(req.params.id, orgId);
        res.json({ success: true, data: user });
    });

    static createUser = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        const validatedData = createUserSchema.parse(req.body);
        const user = await UserService.createUser({ ...validatedData, organizationId: orgId });

        res.status(201).json({ success: true, data: user });
    });

    static updateUser = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        const validatedData = updateUserSchema.parse(req.body);
        const user = await UserService.updateUser(req.params.id, orgId, validatedData);

        res.json({ success: true, data: user });
    });

    static deleteUser = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        await UserService.deleteUser(req.params.id, orgId);
        res.json({ success: true, message: 'User deleted successfully' });
    });
}
