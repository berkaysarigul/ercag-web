const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        // Clean up user
        await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
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
