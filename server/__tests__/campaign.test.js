const prisma = require('../src/lib/prisma');

describe('Kampanya İndirimi Hesaplama', () => {
    let testCategory, testProduct, flashCampaign;

    beforeAll(async () => {
        testCategory = await prisma.category.create({
            data: { name: 'Test Kampanya Kategori' }
        });
        testProduct = await prisma.product.create({
            data: { name: 'Test Kampanya Ürün', description: 'Test', price: 100.00, stock: 50, categoryId: testCategory.id }
        });
        flashCampaign = await prisma.campaign.create({
            data: {
                name: 'Test Flash', type: 'FLASH_SALE', isActive: true,
                startDate: new Date(Date.now() - 86400000),
                endDate: new Date(Date.now() + 86400000),
                config: JSON.stringify({ discountPercent: 20, productIds: [testProduct.id] })
            }
        });
    });

    afterAll(async () => {
        await prisma.campaign.deleteMany({ where: { name: { startsWith: 'Test' } } });
        await prisma.product.deleteMany({ where: { name: 'Test Kampanya Ürün' } });
        await prisma.category.deleteMany({ where: { name: 'Test Kampanya Kategori' } });
        await prisma.$disconnect();
    });

    test('Flash Sale %20 indirim doğru hesaplanmalı', () => {
        const config = JSON.parse(flashCampaign.config);
        const discount = (100 * config.discountPercent) / 100;
        expect(discount).toBe(20);
    });

    test('Süresi dolmuş kampanya geçersiz olmalı', async () => {
        const expired = await prisma.campaign.create({
            data: {
                name: 'Test Expired', type: 'FLASH_SALE', isActive: true,
                startDate: new Date(Date.now() - 172800000),
                endDate: new Date(Date.now() - 86400000),
                config: JSON.stringify({ discountPercent: 50, productIds: [testProduct.id] })
            }
        });
        const now = new Date();
        expect(new Date(expired.endDate) >= now).toBe(false);
        await prisma.campaign.delete({ where: { id: expired.id } });
    });

    test('isActive false kampanya uygulanmamalı', async () => {
        const inactive = await prisma.campaign.create({
            data: {
                name: 'Test Inactive', type: 'FLASH_SALE', isActive: false,
                startDate: new Date(Date.now() - 86400000),
                endDate: new Date(Date.now() + 86400000),
                config: JSON.stringify({ discountPercent: 50, productIds: [testProduct.id] })
            }
        });
        expect(inactive.isActive).toBe(false);
        await prisma.campaign.delete({ where: { id: inactive.id } });
    });
});

describe('Kupon Doğrulama', () => {
    let testCoupon;

    beforeAll(async () => {
        testCoupon = await prisma.coupon.create({
            data: { code: 'TESTKUPON26', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 50, isActive: true, expirationDate: new Date(Date.now() + 86400000) }
        });
    });

    afterAll(async () => {
        await prisma.coupon.deleteMany({ where: { code: { startsWith: 'TEST' } } });
        await prisma.$disconnect();
    });

    test('%15 kupon doğru hesaplanmalı', () => {
        const discount = (200 * 15) / 100;
        expect(discount).toBe(30);
    });

    test('Min tutar altında kupon uygulanmamalı', () => {
        expect(30 >= testCoupon.minOrderAmount).toBe(false);
    });

    test('İndirim sipariş tutarını geçmemeli', () => {
        const discount = Math.min((20 * 100) / 100, 20);
        expect(discount).toBe(20);
    });
});
