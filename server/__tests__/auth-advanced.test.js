const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Auth İleri Seviye Testler', () => {
    const testEmail = 'test_authadvanced@test.com';
    const testPhone = '05550000020';
    let userId;

    beforeAll(async () => {
        const stale = await prisma.user.findFirst({ where: { OR: [{ email: testEmail }, { phone: testPhone }] } });
        if (stale) {
            await prisma.auditLog.deleteMany({ where: { userId: stale.id } });
            const cart = await prisma.cart.findUnique({ where: { userId: stale.id } });
            if (cart) {
                await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
                await prisma.cart.delete({ where: { id: cart.id } });
            }
            await prisma.loyaltyHistory.deleteMany({ where: { loyalty: { userId: stale.id } } });
            await prisma.loyaltyPoints.deleteMany({ where: { userId: stale.id } });
            await prisma.user.delete({ where: { id: stale.id } });
        }

        const res = await request(app).post('/api/auth/register').send({
            name: 'Auth Advanced', email: testEmail, password: 'Test123', phone: testPhone, consent: true
        });
        userId = res.body.user?.id;
    });

    afterAll(async () => {
        if (userId) {
            await prisma.auditLog.deleteMany({ where: { userId } });
            const cart = await prisma.cart.findUnique({ where: { userId } });
            if (cart) {
                await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
                await prisma.cart.delete({ where: { id: cart.id } });
            }
            await prisma.loyaltyHistory.deleteMany({ where: { loyalty: { userId } } });
            await prisma.loyaltyPoints.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        }
        await prisma.$disconnect();
    });

    test('Telefon numarasıyla giriş yapabilmeli', async () => {
        const res = await request(app).post('/api/auth/login').send({
            identifier: testPhone, password: 'Test123'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeTruthy();
    });

    test('Email ile giriş yapabilmeli', async () => {
        const res = await request(app).post('/api/auth/login').send({
            identifier: testEmail, password: 'Test123'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeTruthy();
    });

    test('Yanlış şifre ile giriş reddedilmeli', async () => {
        const res = await request(app).post('/api/auth/login').send({
            identifier: testEmail, password: 'WrongPass1'
        });
        expect(res.statusCode).toBe(400);
    });

    test('Var olmayan kullanıcı 404 dönmeli', async () => {
        const res = await request(app).post('/api/auth/login').send({
            identifier: 'nonexistent@test.com', password: 'Test123'
        });
        expect(res.statusCode).toBe(404);
    });

    test('Aynı telefon ile tekrar kayıt olamamalı', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Duplicate', email: 'test_dup@test.com', password: 'Test123', phone: testPhone, consent: true
        });
        expect(res.statusCode).toBe(400);
    });

    test('Eksik bilgi ile kayıt reddedilmeli', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Bad Phone', password: 'Test123', consent: true // phone is missing
        });
        expect(res.statusCode).toBe(400);
    });

    test('Şifre sıfırlama kodu gönderilmeli', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: testEmail });
        expect(res.statusCode).toBe(200);
        // Verify code was set in DB
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(user.resetPasswordToken).toBeTruthy();
        expect(user.resetPasswordExpires).toBeTruthy();
    });

    test('Doğru kodla şifre sıfırlama başarılı olmalı', async () => {
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        const code = user.resetPasswordToken;

        // Verify code
        const verifyRes = await request(app).post('/api/auth/verify-code').send({ email: testEmail, code });
        expect(verifyRes.statusCode).toBe(200);
        expect(verifyRes.body.valid).toBe(true);

        // Reset password
        const resetRes = await request(app).post('/api/auth/reset-password').send({
            email: testEmail, code, newPassword: 'NewPass1'
        });
        expect(resetRes.statusCode).toBe(200);

        // Login with new password
        const loginRes = await request(app).post('/api/auth/login').send({
            identifier: testEmail, password: 'NewPass1'
        });
        expect(loginRes.statusCode).toBe(200);
    });

    test('Geçersiz token ile API erişimi 401/403 dönmeli', async () => {
        const res = await request(app)
            .get('/api/orders')
            .set('Authorization', 'Bearer invalidtoken123');
        expect([401, 403]).toContain(res.statusCode);
    });

    test('Token olmadan korumalı route 401 dönmeli', async () => {
        const res = await request(app).get('/api/orders');
        expect(res.statusCode).toBe(401);
    });
});
