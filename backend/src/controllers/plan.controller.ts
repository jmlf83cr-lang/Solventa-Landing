import { Request, Response } from 'express';
import { PlanService } from '../services/plan.service';
import { asyncHandler } from '../middleware/errorHandler';
import { UnauthorizedError } from '../utils/errors';
import { PlanTier } from '@prisma/client';
import { z } from 'zod';

const subscribeSchema = z.object({
    planTier: z.nativeEnum(PlanTier),
});

/**
 * Plans & Subscriptions Controller
 */
export class PlanController {
    static getPlans = asyncHandler(async (_req: Request, res: Response) => {
        const plans = await PlanService.getPlans();
        res.json({ success: true, data: plans });
    });

    static getMySubscription = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        const subscription = await PlanService.getOrganizationSubscription(orgId);
        res.json({ success: true, data: subscription });
    });

    static subscribe = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        const { planTier } = subscribeSchema.parse(req.body);
        const subscription = await PlanService.subscribeOrganization(orgId, planTier);

        res.json({ success: true, data: subscription });
    });

    static cancel = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID required');

        await PlanService.cancelSubscription(orgId);
        res.json({ success: true, message: 'Subscription cancelled successfully' });
    });
}
