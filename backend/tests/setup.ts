import prisma from '../src/config/database';

/**
 * Global testing setup
 */
beforeAll(async () => {
    // Clear database or prepare test environment
    // In a real scenario, you'd use a dedicated test database
    console.log('Setting up test environment...');
});

afterAll(async () => {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('Test environment teardown.');
});
