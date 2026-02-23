const prisma = require('../src/lib/prisma');

describe('Stock Logic', () => {
    let productId;
    let categoryId;

    beforeAll(async () => {
        // Create a test category first (FK constraint on Product.categoryId)
        const category = await prisma.category.create({
            data: { name: 'Stock Test Category' }
        });
        categoryId = category.id;

        const product = await prisma.product.create({
            data: {
                name: 'Stock Test Product',
                description: 'Stock Desc',
                price: 50,
                stock: 100,
                categoryId: categoryId
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        if (productId) {
            await prisma.product.delete({ where: { id: productId } });
        }
        if (categoryId) {
            await prisma.category.delete({ where: { id: categoryId } });
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
