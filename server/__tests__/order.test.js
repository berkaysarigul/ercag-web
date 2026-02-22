const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

let userToken;
let productId;

describe('Order Endpoints', () => {
    beforeAll(async () => {
        // Clean up stale test data
        await prisma.user.deleteMany({ where: { email: 'ordertest@example.com' } });

        // Register user via API
        const userRes = await request(app).post('/api/auth/register').send({
            name: 'Order Test',
            email: 'ordertest@example.com',
            password: 'password123',
            phone: '5559998877'
        });
        userToken = userRes.body.token;

        // Create test product directly via Prisma
        // images field must use Prisma's nested create syntax, NOT a plain array
        const product = await prisma.product.create({
            data: {
                name: 'Test Product',
                description: 'Desc',
                price: 100,
                stock: 10,
                categoryId: 1
                // images omitted — Prisma default is empty relation
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        // Cleanup in correct dependency order
        await prisma.cartItem.deleteMany({ where: { productId } });
        await prisma.orderItem.deleteMany({ where: { productId } });
        await prisma.order.deleteMany({ where: { user: { email: 'ordertest@example.com' } } });
        // Only delete product if it was actually created (productId may be undefined if beforeAll failed)
        if (productId) {
            await prisma.product.delete({ where: { id: productId } });
        }
        await prisma.user.deleteMany({ where: { email: 'ordertest@example.com' } });
        await prisma.$disconnect();
    });

    it('should create an order', async () => {
        // Seed a CartItem for the test user
        const user = await prisma.user.findUnique({ where: { email: 'ordertest@example.com' } });
        let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
        if (!cart) cart = await prisma.cart.create({ data: { userId: user.id } });

        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId: productId,
                quantity: 1
            }
        });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ paymentMethod: 'CREDIT_CARD' });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toEqual('PENDING');
    });
});
