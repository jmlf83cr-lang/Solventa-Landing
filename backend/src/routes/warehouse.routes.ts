import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication to all WMS routes
router.use(authenticate);

// ============================================
// WAREHOUSES
// ============================================

router.get('/warehouses', WarehouseController.getWarehouses);
router.get('/warehouses/:id', WarehouseController.getWarehouseById);
router.post(
    '/warehouses',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    WarehouseController.createWarehouse
);
router.put(
    '/warehouses/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
    WarehouseController.updateWarehouse
);
router.delete(
    '/warehouses/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    WarehouseController.deleteWarehouse
);

// ============================================
// PRODUCTS
// ============================================

router.get('/products', WarehouseController.getProducts);
router.get('/products/:id', WarehouseController.getProductById);
router.post(
    '/products',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
    WarehouseController.createProduct
);
router.put(
    '/products/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
    WarehouseController.updateProduct
);
router.delete(
    '/products/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    WarehouseController.deleteProduct
);

// ============================================
// INVENTORY
// ============================================

router.get('/warehouses/:warehouseId/inventory', WarehouseController.getInventory);
router.post(
    '/inventory/adjust',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR),
    WarehouseController.adjustInventory
);

// ============================================
// ORDERS
// ============================================

router.get('/warehouses/:warehouseId/orders', WarehouseController.getOrders);
router.get('/orders/:id', WarehouseController.getOrderById);
router.post(
    '/orders',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR),
    WarehouseController.createOrder
);
router.patch(
    '/orders/:id/status',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR),
    WarehouseController.updateOrderStatus
);

// ============================================
// MOVEMENTS
// ============================================

router.get('/warehouses/:warehouseId/movements', WarehouseController.getMovements);
router.post(
    '/movements',
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR),
    WarehouseController.createMovement
);

export default router;
