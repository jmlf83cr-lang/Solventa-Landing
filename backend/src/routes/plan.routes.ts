import { Router } from 'express';
import { PlanController } from '../controllers/plan.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', PlanController.getPlans);

// Private routes
router.use(authenticate);

router.get('/my-subscription', PlanController.getMySubscription);
router.post('/subscribe', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), PlanController.subscribe);
router.post('/cancel', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), PlanController.cancel);

export default router;
