import { z } from 'zod';
import {
    WarehouseType,
    ProductCategory,
    ProductStatus,
    OrderType,
    OrderStatus,
    MovementType,
} from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Validation schemas
const createWarehouseSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    type: z.nativeEnum(WarehouseType).optional(),
    organizationId: z.string().uuid(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    capacity: z.number().int().positive().optional(),
});

const createProductSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    category: z.nativeEnum(ProductCategory).optional(),
    organizationId: z.string().uuid(),
    barcode: z.string().optional(),
    weight: z.number().positive().optional(),
    weightUnit: z.string().optional(),
    unitCost: z.number().positive().optional(),
    unitPrice: z.number().positive().optional(),
    minStockLevel: z.number().int().nonnegative().optional(),
    maxStockLevel: z.number().int().positive().optional(),
    reorderPoint: z.number().int().nonnegative().optional(),
});

const createOrderSchema = z.object({
    type: z.nativeEnum(OrderType),
    warehouseId: z.string().uuid(),
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional(),
    supplierName: z.string().optional(),
    notes: z.string().optional(),
    expectedDate: z.string().datetime().optional(),
    items: z.array(
        z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().positive().optional(),
        })
    ).min(1, 'At least one item is required'),
});

const createMovementSchema = z.object({
    type: z.nativeEnum(MovementType),
    warehouseId: z.string().uuid(),
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    fromLocation: z.string().optional(),
    toLocation: z.string().optional(),
    orderId: z.string().uuid().optional(),
    notes: z.string().optional(),
    reference: z.string().optional(),
});

/**
 * Warehouse Management Service
 */
export class WarehouseService {
    // ============================================
    // WAREHOUSES
    // ============================================

    static async getWarehouses(organizationId: string) {
        return prisma.warehouse.findMany({
            where: { organizationId },
            include: {
                _count: {
                    select: {
                        inventory: true,
                        orders: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getWarehouseById(id: string, organizationId: string) {
        const warehouse = await prisma.warehouse.findFirst({
            where: { id, organizationId },
            include: {
                inventory: {
                    include: {
                        product: true,
                    },
                },
                _count: {
                    select: {
                        orders: true,
                        movements: true,
                    },
                },
            },
        });

        if (!warehouse) {
            throw new NotFoundError('Warehouse not found');
        }

        return warehouse;
    }

    static async createWarehouse(data: z.infer<typeof createWarehouseSchema>) {
        const validatedData = createWarehouseSchema.parse(data);

        return prisma.warehouse.create({
            data: {
                ...validatedData,
                isActive: true,
            },
        });
    }

    static async updateWarehouse(
        id: string,
        organizationId: string,
        data: Partial<z.infer<typeof createWarehouseSchema>>
    ) {
        // Verify warehouse exists
        await this.getWarehouseById(id, organizationId);

        return prisma.warehouse.update({
            where: { id },
            data,
        });
    }

    static async deleteWarehouse(id: string, organizationId: string) {
        // Verify warehouse exists
        await this.getWarehouseById(id, organizationId);

        return prisma.warehouse.delete({
            where: { id },
        });
    }

    // ============================================
    // PRODUCTS
    // ============================================

    static async getProducts(organizationId: string, filters?: {
        category?: ProductCategory;
        status?: ProductStatus;
        search?: string;
    }) {
        const where: any = { organizationId };

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
                { barcode: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return prisma.product.findMany({
            where,
            include: {
                _count: {
                    select: {
                        inventory: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getProductById(id: string, organizationId: string) {
        const product = await prisma.product.findFirst({
            where: { id, organizationId },
            include: {
                inventory: {
                    include: {
                        warehouse: true,
                    },
                },
            },
        });

        if (!product) {
            throw new NotFoundError('Product not found');
        }

        return product;
    }

    static async createProduct(data: z.infer<typeof createProductSchema>) {
        const validatedData = createProductSchema.parse(data);

        return prisma.product.create({
            data: {
                ...validatedData,
                status: ProductStatus.ACTIVE,
            },
        });
    }

    static async updateProduct(
        id: string,
        organizationId: string,
        data: Partial<z.infer<typeof createProductSchema>>
    ) {
        // Verify product exists
        await this.getProductById(id, organizationId);

        return prisma.product.update({
            where: { id },
            data,
        });
    }

    static async deleteProduct(id: string, organizationId: string) {
        // Verify product exists
        await this.getProductById(id, organizationId);

        return prisma.product.delete({
            where: { id },
        });
    }

    // ============================================
    // INVENTORY
    // ============================================

    static async getInventory(warehouseId: string, organizationId: string) {
        // Verify warehouse belongs to organization
        await this.getWarehouseById(warehouseId, organizationId);

        return prisma.inventory.findMany({
            where: { warehouseId },
            include: {
                product: true,
                warehouse: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    static async getInventoryByProduct(productId: string, organizationId: string) {
        // Verify product belongs to organization
        await this.getProductById(productId, organizationId);

        return prisma.inventory.findMany({
            where: { productId },
            include: {
                warehouse: true,
            },
        });
    }

    static async adjustInventory(data: {
        warehouseId: string;
        productId: string;
        quantity: number;
        location?: string;
        organizationId: string;
        userId: string;
    }) {
        // Verify warehouse and product exist
        await this.getWarehouseById(data.warehouseId, data.organizationId);
        await this.getProductById(data.productId, data.organizationId);

        // Update or create inventory record
        const inventory = await prisma.inventory.upsert({
            where: {
                warehouseId_productId: {
                    warehouseId: data.warehouseId,
                    productId: data.productId,
                },
            },
            update: {
                quantity: { increment: data.quantity },
                availableQuantity: { increment: data.quantity },
                location: data.location,
                lastMovementDate: new Date(),
            },
            create: {
                warehouseId: data.warehouseId,
                productId: data.productId,
                quantity: Math.max(0, data.quantity),
                availableQuantity: Math.max(0, data.quantity),
                reservedQuantity: 0,
                location: data.location,
                lastMovementDate: new Date(),
            },
            include: {
                product: true,
                warehouse: true,
            },
        });

        // Create movement record
        await prisma.movement.create({
            data: {
                type: data.quantity > 0 ? MovementType.INBOUND : MovementType.OUTBOUND,
                warehouseId: data.warehouseId,
                productId: data.productId,
                quantity: Math.abs(data.quantity),
                toLocation: data.location,
                createdById: data.userId,
                notes: 'Inventory adjustment',
            },
        });

        return inventory;
    }

    // ============================================
    // ORDERS
    // ============================================

    static async getOrders(warehouseId: string, organizationId: string, filters?: {
        type?: OrderType;
        status?: OrderStatus;
    }) {
        // Verify warehouse belongs to organization
        await this.getWarehouseById(warehouseId, organizationId);

        const where: any = { warehouseId };

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        return prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { orderDate: 'desc' },
        });
    }

    static async getOrderById(id: string, organizationId: string) {
        const order = await prisma.order.findFirst({
            where: {
                id,
                warehouse: {
                    organizationId,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                warehouse: true,
                movements: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        return order;
    }

    static async createOrder(
        data: z.infer<typeof createOrderSchema>,
        userId: string,
        organizationId: string
    ) {
        const validatedData = createOrderSchema.parse(data);

        // Verify warehouse exists
        await this.getWarehouseById(validatedData.warehouseId, organizationId);

        // Generate order number
        const orderNumber = `ORD-${Date.now()}`;

        // Calculate total amount
        const totalAmount = validatedData.items.reduce((sum, item) => {
            return sum + (item.unitPrice || 0) * item.quantity;
        }, 0);

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber,
                type: validatedData.type,
                status: OrderStatus.PENDING,
                warehouseId: validatedData.warehouseId,
                customerName: validatedData.customerName,
                customerEmail: validatedData.customerEmail,
                supplierName: validatedData.supplierName,
                notes: validatedData.notes,
                totalAmount,
                currency: 'USD',
                orderDate: new Date(),
                expectedDate: validatedData.expectedDate ? new Date(validatedData.expectedDate) : undefined,
                createdById: userId,
                items: {
                    create: validatedData.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: (item.unitPrice || 0) * item.quantity,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return order;
    }

    static async updateOrderStatus(
        id: string,
        status: OrderStatus,
        organizationId: string
    ) {
        // Verify order exists
        await this.getOrderById(id, organizationId);

        return prisma.order.update({
            where: { id },
            data: {
                status,
                ...(status === OrderStatus.COMPLETED && { completedDate: new Date() }),
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    // ============================================
    // MOVEMENTS
    // ============================================

    static async getMovements(warehouseId: string, organizationId: string, filters?: {
        type?: MovementType;
        productId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        // Verify warehouse belongs to organization
        await this.getWarehouseById(warehouseId, organizationId);

        const where: any = { warehouseId };

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.productId) {
            where.productId = filters.productId;
        }

        if (filters?.startDate || filters?.endDate) {
            where.movementDate = {};
            if (filters.startDate) {
                where.movementDate.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.movementDate.lte = filters.endDate;
            }
        }

        return prisma.movement.findMany({
            where,
            include: {
                product: true,
                warehouse: true,
                order: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { movementDate: 'desc' },
        });
    }

    static async createMovement(
        data: z.infer<typeof createMovementSchema>,
        userId: string,
        organizationId: string
    ) {
        const validatedData = createMovementSchema.parse(data);

        // Verify warehouse and product exist
        await this.getWarehouseById(validatedData.warehouseId, organizationId);
        await this.getProductById(validatedData.productId, organizationId);

        // Create movement
        const movement = await prisma.movement.create({
            data: {
                ...validatedData,
                createdById: userId,
                movementDate: new Date(),
            },
            include: {
                product: true,
                warehouse: true,
            },
        });

        // Update inventory based on movement type
        const quantityChange =
            validatedData.type === MovementType.INBOUND
                ? validatedData.quantity
                : -validatedData.quantity;

        await this.adjustInventory({
            warehouseId: validatedData.warehouseId,
            productId: validatedData.productId,
            quantity: quantityChange,
            location: validatedData.toLocation || validatedData.fromLocation,
            organizationId,
            userId,
        });

        return movement;
    }
}
