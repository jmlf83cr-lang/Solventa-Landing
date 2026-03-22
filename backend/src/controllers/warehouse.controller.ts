import { Request, Response } from 'express';
import { WarehouseService } from '../services/warehouse.service';
import { asyncHandler } from '../middleware/errorHandler';
import { ProductCategory, ProductStatus, OrderType, OrderStatus, MovementType } from '@prisma/client';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

/**
 * Warehouse Management Controller
 */
export class WarehouseController {
    // ============================================
    // WAREHOUSES
    // ============================================

    static getWarehouses = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const warehouses = await WarehouseService.getWarehouses(orgId);
        res.json({ success: true, data: warehouses });
    });

    static getWarehouseById = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const warehouse = await WarehouseService.getWarehouseById(req.params.id, orgId);
        res.json({ success: true, data: warehouse });
    });

    static createWarehouse = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const warehouse = await WarehouseService.createWarehouse({
            ...req.body,
            organizationId: orgId,
        });
        res.status(201).json({ success: true, data: warehouse });
    });

    static updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const warehouse = await WarehouseService.updateWarehouse(req.params.id, orgId, req.body);
        res.json({ success: true, data: warehouse });
    });

    static deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        await WarehouseService.deleteWarehouse(req.params.id, orgId);
        res.json({ success: true, message: 'Warehouse deleted successfully' });
    });

    // ============================================
    // PRODUCTS
    // ============================================

    static getProducts = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const { category, status, search } = req.query;

        const products = await WarehouseService.getProducts(orgId, {
            category: category as ProductCategory,
            status: status as ProductStatus,
            search: search as string,
        });
        res.json({ success: true, data: products });
    });

    static getProductById = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const product = await WarehouseService.getProductById(req.params.id, orgId);
        res.json({ success: true, data: product });
    });

    static createProduct = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const product = await WarehouseService.createProduct({
            ...req.body,
            organizationId: orgId,
        });
        res.status(201).json({ success: true, data: product });
    });

    static updateProduct = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const product = await WarehouseService.updateProduct(req.params.id, orgId, req.body);
        res.json({ success: true, data: product });
    });

    static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        await WarehouseService.deleteProduct(req.params.id, orgId);
        res.json({ success: true, message: 'Product deleted successfully' });
    });

    // ============================================
    // INVENTORY
    // ============================================

    static getInventory = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const inventory = await WarehouseService.getInventory(req.params.warehouseId, orgId);
        res.json({ success: true, data: inventory });
    });

    static adjustInventory = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId;
        if (!orgId || !userId) throw new UnauthorizedError('Auth data required');

        const inventory = await WarehouseService.adjustInventory({
            ...req.body,
            organizationId: orgId,
            userId: userId,
        });
        res.json({ success: true, data: inventory });
    });

    // ============================================
    // ORDERS
    // ============================================

    static getOrders = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const { type, status } = req.query;

        const orders = await WarehouseService.getOrders(req.params.warehouseId, orgId, {
            type: type as OrderType,
            status: status as OrderStatus,
        });
        res.json({ success: true, data: orders });
    });

    static getOrderById = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const order = await WarehouseService.getOrderById(req.params.id, orgId);
        res.json({ success: true, data: order });
    });

    static createOrder = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId;
        if (!orgId || !userId) throw new UnauthorizedError('Auth data required');

        const order = await WarehouseService.createOrder(req.body, userId, orgId);
        res.status(201).json({ success: true, data: order });
    });

    static updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const { status } = req.body;
        if (!status) throw new BadRequestError('Status is required');

        const order = await WarehouseService.updateOrderStatus(req.params.id, status as OrderStatus, orgId);
        res.json({ success: true, data: order });
    });

    // ============================================
    // MOVEMENTS
    // ============================================

    static getMovements = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        if (!orgId) throw new UnauthorizedError('Organization ID is required');

        const { type, productId, startDate, endDate } = req.query;

        const movements = await WarehouseService.getMovements(req.params.warehouseId, orgId, {
            type: type as MovementType,
            productId: productId as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });
        res.json({ success: true, data: movements });
    });

    static createMovement = asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId;
        if (!orgId || !userId) throw new UnauthorizedError('Auth data required');

        const movement = await WarehouseService.createMovement(req.body, userId, orgId);
        res.status(201).json({ success: true, data: movement });
    });
}
