const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Sipariş Durum Geçişleri', () => {
    let customerToken, adminToken;
    let customerId, adminId;
    let categoryId, productId, orderId;

    beforeAll(async () => {
        // Cleanup stale data
        const staleUsers = await prisma.user.findMany({
            where: { email: { in: ['test_status_customer@test.com', 'test_status_admin@test.com'] } }
        });
        for (const u of staleUsers) {
            await prisma.orderItem.deleteMany({ where: { order: { userId: u.id } } });
            await prisma.order.deleteMany({ where: { userId: u.id } });
            const cart = await prisma.cart.findUnique({ where: { userId: u.id } });
            if (cart) {
                await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
                await prisma.cart.delete({ where: { id: cart.id } });
            }
            await prisma.loyaltyHistory.deleteMany({ where: { loyalty: { userId: u.id } } });
            await prisma.loyaltyPoints.deleteMany({ where: { userId: u.id } });
            await prisma.auditLog.deleteMany({ where: { userId: u.id } });
            await prisma.user.delete({ where: { id: u.id } });
        }
        await prisma.product.deleteMany({ where: { name: 'TEST_STATUS_PRODUCT' } });
        await prisma.category.deleteMany({ where: { name: 'TEST_STATUS_CAT' } });

        // Create category + product
        const cat = await prisma.category.create({ data: { name: 'TEST_STATUS_CAT' } });
        categoryId = cat.id;
        const prod = await prisma.product.create({
            data: { name: 'TEST_STATUS_PRODUCT', description: 'Test', price: 50, stock: 20, categoryId }
        });
        productId = prod.id;

        // Register customer
        const custRes = await request(app).post('/api/auth/register').send({
            name: 'Test Status Customer', email: 'test_status_customer@test.com',
            password: 'Test123', phone: '05550000001', consent: true
        });
        customerToken = custRes.body.token;
        const custUser = await prisma.user.findUnique({ where: { email: 'test_status_customer@test.com' } });
        customerId = custUser.id;

        // Create admin user directly
        const bcrypt = require('bcryptjs');
        const hashedPw = await bcrypt.hash('Admin123', 10);
        const admin = await prisma.user.create({
            data: { name: 'Test Status Admin', email: 'test_status_admin@test.com', password: hashedPw, phone: '05550000002', role: 'ADMIN' }
        });
        adminId = admin.id;
        const jwt = require('jsonwebtoken');
        adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    afterAll(async () => {
        await prisma.orderItem.deleteMany({ where: { order: { userId: { in: [customerId, adminId] } } } });
        await prisma.order.deleteMany({ where: { userId: { in: [customerId, adminId] } } });
        // Also clean orders created without userId if any
        await prisma.orderItem.deleteMany({ where: { order: { fullName: 'Test Status Customer' } } });
        await prisma.order.deleteMany({ where: { fullName: 'Test Status Customer' } });
        for (const uid of [customerId, adminId]) {
            if (!uid) continue;
            const cart = await prisma.cart.findUnique({ where: { userId: uid } });
            if (cart) {
                await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
                await prisma.cart.delete({ where: { id: cart.id } });
            }
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

    // Helper: create a fresh order
    const createTestOrder = async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ items: [{ id: productId, quantity: 2 }], fullName: 'Test Status Customer', phoneNumber: '05550000001' });
        return res.body;
    };

    test('Sipariş oluşturulduğunda status PENDING olmalı', async () => {
        const order = await createTestOrder();
        orderId = order.id;
        expect(order.status).toBe('PENDING');
        expect(order.pickupCode).toBeTruthy();
    });

    test('PENDING → PREPARING geçişi başarılı olmalı', async () => {
        const res = await request(app)
            .put(`/api/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'PREPARING' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('PREPARING');
    });

    test('PREPARING → READY geçişi başarılı olmalı', async () => {
        const res = await request(app)
            .put(`/api/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'READY' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('READY');
        expect(res.body.readyAt).toBeTruthy();
    });

    test('READY → COMPLETED geçişi başarılı olmalı', async () => {
        const res = await request(app)
            .put(`/api/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'COMPLETED' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('COMPLETED');
        expect(res.body.completedAt).toBeTruthy();
    });

    test('COMPLETED → PENDING geçişi ENGELLENMELİ', async () => {
        const res = await request(app)
            .put(`/api/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'PENDING' });
        expect(res.statusCode).toBe(400);
    });

    test('COMPLETED → CANCELLED geçişi ENGELLENMELİ', async () => {
        const res = await request(app)
            .put(`/api/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'CANCELLED' });
        expect(res.statusCode).toBe(400);
    });

    test('PENDING → CANCELLED geçişi başarılı olmalı', async () => {
        const newOrder = await createTestOrder();
        const res = await request(app)
            .put(`/api/orders/${newOrder.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'CANCELLED' });
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('CANCELLED');
    });

    test('PENDING → READY geçişi ENGELLENMELİ (atlama yasak)', async () => {
        const newOrder = await createTestOrder();
        const res = await request(app)
            .put(`/api/orders/${newOrder.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'READY' });
        expect(res.statusCode).toBe(400);
    });

    test('Müşteri kendi PENDING siparişini iptal edebilmeli', async () => {
        const newOrder = await createTestOrder();
        const res = await request(app)
            .put(`/api/orders/${newOrder.id}/cancel`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('CANCELLED');
    });

    test('Müşteri PREPARING siparişini iptal EDEMEMELİ', async () => {
        const newOrder = await createTestOrder();
        // Admin advances to PREPARING
        await request(app)
            .put(`/api/orders/${newOrder.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'PREPARING' });
        // Customer tries cancel
        const res = await request(app)
            .put(`/api/orders/${newOrder.id}/cancel`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.statusCode).toBe(400);
    });
});
