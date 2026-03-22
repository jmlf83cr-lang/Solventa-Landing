import { PrismaClient, PlanTier, UserRole, UserStatus, WarehouseType, ProductCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Create Plans
    console.log('Creating plans...');
    const plans = [
        {
            tier: PlanTier.EMPRENDEDOR,
            name: 'Emprendedor Digital',
            description: 'Ideal para startups y pequeños negocios comenzando su transformación.',
            price: 99.0,
            maxUsers: 5,
            maxWarehouses: 1,
            maxProducts: 1000,
            hasRealtimeSync: true,
            supportLevel: 'Email',
        },
        {
            tier: PlanTier.PYME,
            name: 'Expansión PYME',
            description: 'Solución completa para empresas en crecimiento con necesidades logísticas reales.',
            price: 249.0,
            maxUsers: 15,
            maxWarehouses: 3,
            maxProducts: 10000,
            hasRealtimeSync: true,
            hasAdvancedReports: true,
            supportLevel: 'Priority Email',
        },
        {
            tier: PlanTier.INVERSION,
            name: 'Inversión Estratégica',
            description: 'Poder industrial con gemelos digitales y optimización por IA.',
            price: 599.0,
            maxUsers: 50,
            maxWarehouses: 10,
            maxProducts: 100000,
            hasRealtimeSync: true,
            hasAdvancedReports: true,
            hasAPIAccess: true,
            hasDigitalTwin: true,
            supportLevel: '24/7 Support',
        },
        {
            tier: PlanTier.ENTERPRISE,
            name: 'Infrastructure Enterprise',
            description: 'Soberanía total de datos y personalización extrema para líderes globales.',
            price: 1499.0,
            maxUsers: 999,
            maxWarehouses: 999,
            maxProducts: 999999,
            hasRealtimeSync: true,
            hasAdvancedReports: true,
            hasAPIAccess: true,
            hasDigitalTwin: true,
            supportLevel: 'Dedicated Account Manager',
        },
    ];

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { tier: plan.tier },
            update: plan,
            create: plan,
        });
    }

    // 2. Create Default Organization
    console.log('Creating default organization...');
    const organization = await prisma.organization.upsert({
        where: { rut: '77.777.777-K' },
        update: {},
        create: {
            name: 'Solventa Demo Corp',
            rut: '77.777.777-K',
            email: 'demo@solventa.cl',
            address: 'Av. Tech 123, Santiago, Chile',
        },
    });

    // 3. Create Super Admin User
    console.log('Creating super admin user...');
    const hashedPassword = await bcrypt.hash('Solventa2026!', 12);
    await prisma.user.upsert({
        where: { email: 'admin@solventa.cl' },
        update: {},
        create: {
            email: 'admin@solventa.cl',
            password: hashedPassword,
            firstName: 'Solventa',
            lastName: 'Admin',
            role: UserRole.SUPER_ADMIN,
            status: UserStatus.ACTIVE,
            organizationId: organization.id,
        },
    });

    // 4. Assign Plan to Organization
    console.log('Assigning plan to organization...');
    const enterprisePlan = await prisma.plan.findUnique({ where: { tier: PlanTier.ENTERPRISE } });
    if (enterprisePlan) {
        await prisma.subscription.upsert({
            where: { organizationId: organization.id },
            update: { planId: enterprisePlan.id },
            create: {
                organizationId: organization.id,
                planId: enterprisePlan.id,
                status: 'ACTIVE',
            },
        });
    }

    // 5. Create a Warehouse
    console.log('Creating a sample warehouse...');
    const warehouse = await prisma.warehouse.upsert({
        where: { code: 'WH-SCL-01' },
        update: {},
        create: {
            code: 'WH-SCL-01',
            name: 'Centro de Distribución Santiago',
            type: WarehouseType.DISTRIBUTION,
            organizationId: organization.id,
            address: 'Parque Industrial Sur',
            city: 'Santiago',
            country: 'Chile',
        },
    });

    // 6. Create some Products
    console.log('Creating sample products...');
    const products = [
        { sku: 'TS-001', name: 'Sensor Térmico H-100', category: ProductCategory.COMPONENT },
        { sku: 'PC-042', name: 'Controlador de Flujo Pro', category: ProductCategory.COMPONENT },
        { sku: 'LB-992', name: 'Software Licencia HaraS', category: ProductCategory.FINISHED_GOOD },
    ];

    for (const prod of products) {
        await prisma.product.upsert({
            where: { sku: prod.sku },
            update: {},
            create: {
                ...prod,
                organizationId: organization.id,
                unitPrice: 49.99,
                unitCost: 25.0,
            },
        });
    }

    console.log('✅ Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
