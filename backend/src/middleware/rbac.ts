import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ForbiddenError('You do not have permission to access this resource')
            );
        }

        next();
    };
};

/**
 * Organization Access Control
 * Ensures user belongs to the organization they're trying to access
 */
export const authorizeOrganization = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
    }

    const targetOrgId = req.params.organizationId || req.body.organizationId;

    // Super admins can access any organization
    if (req.user.role === UserRole.SUPER_ADMIN) {
        return next();
    }

    // Check if user belongs to the organization
    if (req.user.organizationId !== targetOrgId) {
        return next(new ForbiddenError('Access denied to this organization'));
    }

    next();
};

/**
 * Self or Admin Access Control
 * User can only access their own data unless they're an admin
 */
export const authorizeSelfOrAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
    }

    const targetUserId = req.params.userId || req.params.id;

    // Allow if accessing own data
    if (req.user.userId === targetUserId) {
        return next();
    }

    // Allow if admin or super admin
    if (
        req.user.role === UserRole.ADMIN ||
        req.user.role === UserRole.SUPER_ADMIN
    ) {
        return next();
    }

    return next(new ForbiddenError('You can only access your own data'));
};
