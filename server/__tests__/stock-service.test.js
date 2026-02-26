const prisma = require('../src/lib/prisma');
const { recordStockMovement } = require('../src/services/stockService');

describe('Stok Servisi (recordStockMovement)', () => {
    let categoryId, productId;

    beforeAll(async () => {
        await prisma.product.deleteMany({ where: { name: 'TEST_STOCKSVC_PROD' } });
        await prisma.category.deleteMany({ where: { name: 'TEST_STOCKSVC_CAT' } });

        const cat = await prisma.category.create({ data: { name: 'TEST_STOCKSVC_CAT' } });
        categoryId = cat.id;

        const prod = await prisma.product.create({
            data: { name: 'TEST_STOCKSVC_PROD', description: 'T', price: 30, stock: 100, categoryId, lowStockThreshold: 10 }
        });
        productId = prod.id;
    });

    afterAll(async () => {
        await prisma.stockMovement.deleteMany({ where: { productId } });
        await prisma.stockAlert.deleteMany({ where: { productId } });
        await prisma.product.deleteMany({ where: { id: productId } });
        await prisma.category.deleteMany({ where: { id: categoryId } });
        await prisma.$disconnect();
    });

    test('Stok çıkışı doğru hesaplanmalı (IN: -20)', async () => {
        const result = await recordStockMovement(productId, 'ORDER', -20, 'Test sipariş');
        expect(result.previousStock).toBe(100);
        expect(result.newStock).toBe(80);
    });

    test('Stok girişi doğru hesaplanmalı (IN: +50)', async () => {
        const result = await recordStockMovement(productId, 'IN', 50, 'Test tedarik');
        expect(result.previousStock).toBe(80);
        expect(result.newStock).toBe(130);
    });

    test('StockMovement kaydı oluşturulmalı', async () => {
        const movements = await prisma.stockMovement.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });
        expect(movements.length).toBeGreaterThanOrEqual(2);
        expect(movements[0].type).toBe('IN');
        expect(movements[0].quantity).toBe(50);
    });

    test('Olmayan ürün için hata fırlatmalı', async () => {
        await expect(
            recordStockMovement(999999, 'IN', 10, 'test')
        ).rejects.toThrow();
    });

    test('Stok sıfırın altına düşebilmeli (negatif stok kontrolü uygulama katmanında)', async () => {
        // recordStockMovement negatif stok engellemiyor — bu iş mantığına bağlı
        // Ama fonksiyon hata vermeden çalışmalı
        const prod = await prisma.product.findUnique({ where: { id: productId } });
        const bigDecrease = -(prod.stock + 5);
        const result = await recordStockMovement(productId, 'ADJUSTMENT', bigDecrease, 'Test negatif');
        expect(result.newStock).toBeLessThan(0);
        // Restore
        await recordStockMovement(productId, 'ADJUSTMENT', -result.newStock + 50, 'Test restore');
    });
});
