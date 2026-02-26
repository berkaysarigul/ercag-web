const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Sipariş Takip & Teslimat Kodu', () => {
    let customerToken, adminToken;
    let customerId, adminId;
    let categoryId, productId;
    let testOrder;

    beforeAll(async () => {
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const pw = await bcrypt.hash('Test123', 10);

        // Clean
        for (const email of ['test_track_cust@test.com', 'test_track_admin@test.com']) {
            const u = await prisma.user.findUnique({ where: { email } });
            if (u) {
                await prisma.orderItem.deleteMany({ where: { order: { userId: u.id } } });
                await prisma.order.deleteMany({ where: { userId: u.id } });
                const cart = await prisma.cart.findUnique({ where: { userId: u.id } });
                if (cart) { await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }); await prisma.cart.delete({ where: { id: cart.id } }); }
                await prisma.loyaltyHistory.deleteMany({ where: { loyalty: { userId: u.id } } });
                await prisma.loyaltyPoints.deleteMany({ where: { userId: u.id } });
                await prisma.auditLog.deleteMany({ where: { userId: u.id } });
                await prisma.user.delete({ where: { id: u.id } });
            }
        }
        await prisma.product.deleteMany({ where: { name: 'TEST_TRACK_PROD' } });
        await prisma.category.deleteMany({ where: { name: 'TEST_TRACK_CAT' } });

        const cat = await prisma.category.create({ data: { name: 'TEST_TRACK_CAT' } });
        categoryId = cat.id;
        const prod = await prisma.product.create({
            data: { name: 'TEST_TRACK_PROD', description: 'T', price: 40, stock: 30, categoryId }
        });
        productId = prod.id;

        // Customer
        const custRes = await request(app).post('/api/auth/register').send({
            name: 'Track Cust', email: 'test_track_cust@test.com', password: 'Test123', phone: '05550000050', consent: true
        });
        customerToken = custRes.body.token;
        customerId = (await prisma.user.findUnique({ where: { email: 'test_track_cust@test.com' } })).id;

        // Admin
        const admin = await prisma.user.create({
            data: { name: 'Track Admin', email: 'test_track_admin@test.com', password: pw, phone: '05550000051', role: 'ADMIN' }
        });
        adminId = admin.id;
        adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Create order
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ items: [{ id: productId, quantity: 1 }], fullName: 'Track Cust', phoneNumber: '05550000050' });
        testOrder = orderRes.body;
    });

    afterAll(async () => {
        for (const uid of [customerId, adminId].filter(Boolean)) {
            await prisma.orderItem.deleteMany({ where: { order: { userId: uid } } });
            await prisma.order.deleteMany({ where: { userId: uid } });
            const cart = await prisma.cart.findUnique({ where: { userId: uid } });
            if (cart) { await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }); await prisma.cart.delete({ where: { id: cart.id } }); }
            await prisma.loyaltyHistory.deleteMany({ where: { loyalty: { userId: uid } } });
            await prisma.loyaltyPoints.deleteMany({ where: { userId: uid } });
            await prisma.auditLog.deleteMany({ where: { userId: uid } });
        }
        await prisma.stockMovement.deleteMany({ where: { productId } });
        await prisma.user.deleteMany({ where: { id: { in: [customerId, adminId].filter(Boolean) } } });
        await prisma.product.deleteMany({ where: { id: productId } });
        await prisma.category.deleteMany({ where: { id: categoryId } });
        await prisma.$disconnect();
    });

    test('Teslimat kodu ile sipariş takip edilebilmeli (public)', async () => {
        const res = await request(app).get(`/api/orders/track/${testOrder.pickupCode}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(testOrder.id);
        expect(res.body.status).toBe('PENDING');
        expect(res.body.items.length).toBeGreaterThan(0);
    });

    test('Geçersiz teslimat kodu 404 dönmeli', async () => {
        const res = await request(app).get('/api/orders/track/XXXXXX');
        expect(res.statusCode).toBe(404);
    });

    test('Admin teslimat kodu ile sipariş doğrulayabilmeli', async () => {
        const res = await request(app)
            .post('/api/orders/verify-code')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ code: testOrder.pickupCode });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.order.id).toBe(testOrder.id);
    });

    test('Sipariş pickupCode benzersiz olmalı', async () => {
        const order2Res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ items: [{ id: productId, quantity: 1 }], fullName: 'Track Cust', phoneNumber: '05550000050' });
        expect(order2Res.body.pickupCode).not.toBe(testOrder.pickupCode);
    });

    test('Kendi siparişlerini listeleyebilmeli', async () => {
        const res = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    test('statusHistory JSON olarak kaydedilmeli', async () => {
        // Advance to PREPARING
        await request(app)
            .put(`/api/orders/${testOrder.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'PREPARING' });

        const order = await prisma.order.findUnique({ where: { id: testOrder.id } });
        const history = JSON.parse(order.statusHistory);
        expect(history.length).toBeGreaterThanOrEqual(2);
        expect(history[0].status).toBe('PENDING');
        expect(history[1].status).toBe('PREPARING');
    });
});
