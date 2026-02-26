const prisma = require('../src/lib/prisma');
const { applyActiveCampaigns } = require('../src/controllers/campaignController');

describe('Kampanya İndirimi Hesaplama (applyActiveCampaigns)', () => {
    let categoryId, product1Id, product2Id;
    let flashCampaignId, categoryCampaignId, bxgyCampaignId, expiredCampaignId;

    beforeAll(async () => {
        // Clean
        await prisma.campaign.deleteMany({ where: { name: { startsWith: 'TEST_CAMP_' } } });
        await prisma.product.deleteMany({ where: { name: { startsWith: 'TEST_CAMP_' } } });
        await prisma.category.deleteMany({ where: { name: 'TEST_CAMP_CAT' } });

        // Setup
        const cat = await prisma.category.create({ data: { name: 'TEST_CAMP_CAT' } });
        categoryId = cat.id;

        const p1 = await prisma.product.create({
            data: { name: 'TEST_CAMP_PROD1', description: 'T', price: 100, stock: 50, categoryId }
        });
        product1Id = p1.id;

        const p2 = await prisma.product.create({
            data: { name: 'TEST_CAMP_PROD2', description: 'T', price: 60, stock: 50, categoryId }
        });
        product2Id = p2.id;

        // Active Flash Sale %25 on product1
        const fc = await prisma.campaign.create({
            data: {
                name: 'TEST_CAMP_FLASH', type: 'FLASH_SALE', isActive: true,
                startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000),
                config: JSON.stringify({ discountPercent: 25, productIds: [product1Id] })
            }
        });
        flashCampaignId = fc.id;

        // Active Category Discount %10 on category
        const cc = await prisma.campaign.create({
            data: {
                name: 'TEST_CAMP_CATDISC', type: 'CATEGORY_DISCOUNT', isActive: true,
                startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000),
                config: JSON.stringify({ categoryId: categoryId, discountPercent: 10 })
            }
        });
        categoryCampaignId = cc.id;

        // Active BUY_X_GET_Y: buy 3 pay 2
        const bx = await prisma.campaign.create({
            data: {
                name: 'TEST_CAMP_BXGY', type: 'BUY_X_GET_Y', isActive: true,
                startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000),
                config: JSON.stringify({ buyQuantity: 3, payQuantity: 2, categoryId: categoryId })
            }
        });
        bxgyCampaignId = bx.id;

        // Expired campaign (should NOT apply)
        const ec = await prisma.campaign.create({
            data: {
                name: 'TEST_CAMP_EXPIRED', type: 'FLASH_SALE', isActive: true,
                startDate: new Date('2020-01-01'), endDate: new Date('2020-12-31'),
                config: JSON.stringify({ discountPercent: 99, productIds: [product1Id] })
            }
        });
        expiredCampaignId = ec.id;
    });

    afterAll(async () => {
        await prisma.campaign.deleteMany({ where: { name: { startsWith: 'TEST_CAMP_' } } });
        await prisma.product.deleteMany({ where: { name: { startsWith: 'TEST_CAMP_' } } });
        await prisma.category.deleteMany({ where: { name: 'TEST_CAMP_CAT' } });
        await prisma.$disconnect();
    });

    test('Flash Sale %25 doğru hesaplanmalı', async () => {
        // Temporarily deactivate other campaigns to isolate
        await prisma.campaign.updateMany({
            where: { id: { in: [categoryCampaignId, bxgyCampaignId] } },
            data: { isActive: false }
        });

        const items = [
            { productId: product1Id, price: 100, quantity: 2, product: { categoryId } }
        ];
        const result = await applyActiveCampaigns(items);
        // 100 * 2 * 25% = 50
        expect(result.totalDiscount).toBe(50);
        expect(result.appliedCampaigns.length).toBeGreaterThan(0);

        // Restore
        await prisma.campaign.updateMany({
            where: { id: { in: [categoryCampaignId, bxgyCampaignId] } },
            data: { isActive: true }
        });
    });

    test('Category Discount %10 doğru hesaplanmalı', async () => {
        await prisma.campaign.updateMany({
            where: { id: { in: [flashCampaignId, bxgyCampaignId] } },
            data: { isActive: false }
        });

        const items = [
            { productId: product2Id, price: 60, quantity: 3, product: { categoryId } }
        ];
        const result = await applyActiveCampaigns(items);
        // 60 * 3 * 10% = 18
        expect(result.totalDiscount).toBe(18);

        await prisma.campaign.updateMany({
            where: { id: { in: [flashCampaignId, bxgyCampaignId] } },
            data: { isActive: true }
        });
    });

    test('Süresi dolmuş kampanya UYGULAMAMALI', async () => {
        // Deactivate all active ones
        await prisma.campaign.updateMany({
            where: { id: { in: [flashCampaignId, categoryCampaignId, bxgyCampaignId] } },
            data: { isActive: false }
        });

        const items = [
            { productId: product1Id, price: 100, quantity: 1, product: { categoryId } }
        ];
        const result = await applyActiveCampaigns(items);
        // Expired campaign should not apply
        expect(result.totalDiscount).toBe(0);

        await prisma.campaign.updateMany({
            where: { id: { in: [flashCampaignId, categoryCampaignId, bxgyCampaignId] } },
            data: { isActive: true }
        });
    });

    test('Kampanya dışı ürüne indirim UYGULAMAMALI', async () => {
        await prisma.campaign.updateMany({
            where: { id: { in: [categoryCampaignId, bxgyCampaignId] } },
            data: { isActive: false }
        });

        // Product2 is not in flash sale productIds
        const items = [
            { productId: product2Id, price: 60, quantity: 1, product: { categoryId } }
        ];
        const result = await applyActiveCampaigns(items);
        expect(result.totalDiscount).toBe(0);

        await prisma.campaign.updateMany({
            where: { id: { in: [categoryCampaignId, bxgyCampaignId] } },
            data: { isActive: true }
        });
    });

    test('Boş items dizisi ile hata vermemeli', async () => {
        const result = await applyActiveCampaigns([]);
        expect(result.totalDiscount).toBe(0);
        expect(result.appliedCampaigns).toEqual([]);
    });
});
