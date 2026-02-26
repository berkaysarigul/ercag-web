const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Yetkilendirme (Role-Based Access)', () => {
    let customerToken, staffToken, adminToken;
    let customerUserId, staffUserId, adminUserId;

    beforeAll(async () => {
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const pw = await bcrypt.hash('Test123', 10);

        // Clean
        const emails = ['test_authz_cust@test.com', 'test_authz_staff@test.com', 'test_authz_admin@test.com'];
        for (const email of emails) {
            const u = await prisma.user.findUnique({ where: { email } });
            if (u) {
                await prisma.auditLog.deleteMany({ where: { userId: u.id } });
                await prisma.user.delete({ where: { id: u.id } });
            }
        }

        const cust = await prisma.user.create({
            data: { name: 'Cust', email: 'test_authz_cust@test.com', password: pw, phone: '05550000030', role: 'CUSTOMER' }
        });
        customerUserId = cust.id;
        customerToken = jwt.sign({ userId: cust.id, role: 'CUSTOMER' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const staff = await prisma.user.create({
            data: { name: 'Staff', email: 'test_authz_staff@test.com', password: pw, phone: '05550000031', role: 'STAFF' }
        });
        staffUserId = staff.id;
        staffToken = jwt.sign({ userId: staff.id, role: 'STAFF' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const admin = await prisma.user.create({
            data: { name: 'Admin', email: 'test_authz_admin@test.com', password: pw, phone: '05550000032', role: 'ADMIN' }
        });
        adminUserId = admin.id;
        adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    afterAll(async () => {
        const ids = [customerUserId, staffUserId, adminUserId].filter(Boolean);
        await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
        await prisma.$disconnect();
    });

    // Admin-only endpoints
    test('CUSTOMER admin paneline erişememeli (GET /api/orders/all)', async () => {
        const res = await request(app)
            .get('/api/orders/all')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('STAFF admin sipariş listesine erişebilmeli', async () => {
        const res = await request(app)
            .get('/api/orders/all')
            .set('Authorization', `Bearer ${staffToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('ADMIN admin sipariş listesine erişebilmeli', async () => {
        const res = await request(app)
            .get('/api/orders/all')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('CUSTOMER kullanıcı listesine erişememeli (GET /api/users)', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('STAFF kullanıcı listesine erişememeli (isAdmin gerektiriyor)', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${staffToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('ADMIN kullanıcı listesine erişebilmeli', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('CUSTOMER kampanya oluşturamamalı', async () => {
        const res = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: 'Hack', type: 'FLASH_SALE', config: '{}', startDate: new Date(), endDate: new Date() });
        expect(res.statusCode).toBe(403);
    });
});
