import { PlanTier, SubscriptionStatus } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

/**
 * Plans & Subscriptions Service
 */
export class PlanService {
    /**
     * Get all available plans
     */
    static async getPlans() {
        return prisma.plan.findMany({
            orderBy: { price: 'asc' },
        });
    }

    /**
     * Get a plan by ID or Tier
     */
    static async getPlan(idOrTier: string | PlanTier) {
        const plan = await prisma.plan.findFirst({
            where: {
                OR: [
                    { id: typeof idOrTier === 'string' && idOrTier.length === 36 ? idOrTier : undefined },
                    { tier: idOrTier as PlanTier },
                ],
            },
        });

        if (!plan) {
            throw new NotFoundError('Plan not found');
        }

        return plan;
    }

    /**
     * Get subscription for an organization
     */
    static async getOrganizationSubscription(organizationId: string) {
        const subscription = await prisma.subscription.findUnique({
            where: { organizationId },
            include: {
                plan: true,
                organization: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!subscription) {
            throw new NotFoundError('Subscription not found for this organization');
        }

        return subscription;
    }

    /**
     * Create or update subscription for an organization
     */
    static async subscribeOrganization(organizationId: string, planTier: PlanTier) {
        const plan = await this.getPlan(planTier);

        return prisma.subscription.upsert({
            where: { organizationId },
            update: {
                planId: plan.id,
                status: SubscriptionStatus.ACTIVE,
                updatedAt: new Date(),
            },
            create: {
                organizationId,
                planId: plan.id,
                status: SubscriptionStatus.ACTIVE,
                startDate: new Date(),
            },
            include: {
                plan: true,
            },
        });
    }

    /**
     * Cancel subscription
     */
    static async cancelSubscription(organizationId: string) {
        return prisma.subscription.update({
            where: { organizationId },
            data: {
                status: SubscriptionStatus.CANCELLED,
                autoRenew: false,
            },
        });
    }
}
