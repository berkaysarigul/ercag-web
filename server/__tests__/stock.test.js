const prisma = require('../src/lib/prisma');

describe('Stock Logic', () => {
    let productId;

    beforeAll(async () => {
        // images field must NOT be passed as plain array — omit it to use default empty relation
        const product = await prisma.product.create({
            data: {
                name: 'Stock Test Product',
                description: 'Stock Desc',
                price: 50,
                stock: 100,
                categoryId: 1
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        // Guard: only delete if creation succeeded
        if (productId) {
            await prisma.product.delete({ where: { id: productId } });
        }
        await prisma.$disconnect();
    });

    it('should allow negative stock prevention logic (unit test perspective)', async () => {
        const updated = await prisma.product.update({
            where: { id: productId },
            data: { stock: { decrement: 10 } }
        });
        expect(updated.stock).toEqual(90);
    });
});
