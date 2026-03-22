import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import warehouseRoutes from './warehouse.routes';
import planRoutes from './plan.routes';

const router = Router();

/**
 * Main API Router
 * Groups all module routers
 */

// Auth routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// WMS routes
router.use('/wms', warehouseRoutes);

// Plans & Subscriptions routes
router.use('/plans', planRoutes);

export default router;
