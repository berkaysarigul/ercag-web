const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Auth Endpoints', () => {
    const cleanupTestUsers = async () => {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: 'test@example.com' },
                    { email: 'test2@example.com' },
                    { phone: '5551234567' }
                ]
            }
        });
        const userIds = users.map(u => u.id);
        if (userIds.length > 0) {
            await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: userIds } } } });
            await prisma.cart.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.loyaltyHistory.deleteMany({ where: { loyalty: { userId: { in: userIds } } } });
            await prisma.loyaltyPoints.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.wishlist.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.review.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.stockAlert.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.orderItem.deleteMany({ where: { order: { userId: { in: userIds } } } });
            await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }
    };

    beforeAll(async () => {
        await cleanupTestUsers();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    phone: '5551234567'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with missing phone', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test2@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(400); // Validation error
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(400); // authController returns 400 for wrong password
        });
    });
});
