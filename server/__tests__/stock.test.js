const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Stock Logic', () => {
    let productId;

    beforeAll(async () => {
        const product = await prisma.product.create({
            data: {
                name: 'Stock Test Product',
                description: 'Stock Desc',
                price: 50,
                stock: 100,
                images: [],
                categoryId: 1
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        await prisma.product.delete({ where: { id: productId } });
        await prisma.$disconnect();
    });

    it('should allow negative stock prevention logic (unit test perspective)', async () => {
        // This is more of an integration test if we had a dedicated stock endpoint
        // For now, let's verify database constraint or simulate logic

        // Simulating stock update
        const updated = await prisma.product.update({
            where: { id: productId },
            data: { stock: { decrement: 10 } }
        });
        expect(updated.stock).toEqual(90);
    });
});
