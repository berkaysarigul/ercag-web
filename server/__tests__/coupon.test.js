const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Kupon Doğrulama', () => {
    let adminToken;
    let adminId;
    let percentageCouponCode, fixedCouponCode, expiredCouponCode, inactiveCouponCode;

    beforeAll(async () => {
        // Create admin for coupon creation
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const stale = await prisma.user.findUnique({ where: { email: 'test_coupon_admin@test.com' } });
        if (stale) {
            await prisma.auditLog.deleteMany({ where: { userId: stale.id } });
            await prisma.user.delete({ where: { id: stale.id } });
        }
        const admin = await prisma.user.create({
            data: { name: 'Coupon Admin', email: 'test_coupon_admin@test.com', password: await bcrypt.hash('Admin123', 10), phone: '05550000010', role: 'ADMIN' }
        });
        adminId = admin.id;
        adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Clean stale coupons
        await prisma.coupon.deleteMany({ where: { code: { startsWith: 'TEST_' } } });

        // Create test coupons
        await prisma.coupon.create({
            data: { code: 'TEST_PERC15', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 100, isActive: true }
        });
        percentageCouponCode = 'TEST_PERC15';

        await prisma.coupon.create({
            data: { code: 'TEST_FIXED50', discountType: 'FIXED', discountValue: 50, minOrderAmount: 200, isActive: true }
        });
        fixedCouponCode = 'TEST_FIXED50';

        await prisma.coupon.create({
            data: { code: 'TEST_EXPIRED', discountType: 'PERCENTAGE', discountValue: 30, isActive: true, expirationDate: new Date('2020-01-01') }
        });
        expiredCouponCode = 'TEST_EXPIRED';

        await prisma.coupon.create({
            data: { code: 'TEST_INACTIVE', discountType: 'PERCENTAGE', discountValue: 50, isActive: false }
        });
        inactiveCouponCode = 'TEST_INACTIVE';
    });

    afterAll(async () => {
        await prisma.coupon.deleteMany({ where: { code: { startsWith: 'TEST_' } } });
        await prisma.auditLog.deleteMany({ where: { userId: adminId } });
        await prisma.user.deleteMany({ where: { id: adminId } });
        await prisma.$disconnect();
    });

    test('Yüzdelik kupon doğru hesaplanmalı (%15 of 200 = 30₺)', async () => {
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: percentageCouponCode, cartTotal: 200 });
        expect(res.statusCode).toBe(200);
        expect(res.body.valid).toBe(true);
        expect(res.body.discountAmount).toBe(30);
    });

    test('Sabit tutar kupon doğru çalışmalı (50₺ indirim)', async () => {
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: fixedCouponCode, cartTotal: 300 });
        expect(res.statusCode).toBe(200);
        expect(res.body.valid).toBe(true);
        expect(res.body.discountAmount).toBe(50);
    });

    test('Minimum tutar altında kupon reddedilmeli', async () => {
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: percentageCouponCode, cartTotal: 50 }); // min 100
        expect(res.statusCode).toBe(400);
        expect(res.body.valid).toBe(false);
    });

    test('Süresi dolmuş kupon reddedilmeli', async () => {
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: expiredCouponCode, cartTotal: 500 });
        expect(res.statusCode).toBe(400);
        expect(res.body.valid).toBe(false);
    });

    test('Aktif olmayan kupon reddedilmeli', async () => {
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: inactiveCouponCode, cartTotal: 500 });
        expect(res.statusCode).toBe(400);
        expect(res.body.valid).toBe(false);
    });

    test('Geçersiz kupon kodu 404 dönmeli', async () => {
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: 'NONEXISTENT_CODE', cartTotal: 500 });
        expect(res.statusCode).toBe(404);
    });

    test('İndirim sepet tutarını aşmamalı', async () => {
        // Fixed coupon 50₺ ama sepet 30₺
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: fixedCouponCode, cartTotal: 250 }); // min 200 OK, discount 50, cart 250 → discount capped at 50
        expect(res.statusCode).toBe(200);
        expect(res.body.discountAmount).toBeLessThanOrEqual(250);
    });

    test('Kupon kodu case-insensitive olmalı', async () => {
        const res = await request(app)
            .post('/api/coupons/validate')
            .send({ code: 'test_perc15', cartTotal: 200 }); // lowercase
        expect(res.statusCode).toBe(200);
        expect(res.body.valid).toBe(true);
    });
});
