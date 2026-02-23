const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

let userToken;
let productId;
let categoryId;
let userId;

describe('Order Endpoints', () => {
    beforeAll(async () => {
        // Clean up any stale data from previous runs (in dependency order)
        const oldUser = await prisma.user.findFirst({ where: { email: 'ordertest@example.com' } });
        if (oldUser) {
            const cart = await prisma.cart.findUnique({ where: { userId: oldUser.id } });
            if (cart) {
                await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
                await prisma.cart.delete({ where: { id: cart.id } });
            }
            await prisma.orderItem.deleteMany({ where: { order: { userId: oldUser.id } } });
            await prisma.order.deleteMany({ where: { userId: oldUser.id } });
            await prisma.user.delete({ where: { id: oldUser.id } });
        }

        // Create a test category (needed for FK constraint on Product.categoryId)
        const category = await prisma.category.create({
            data: { name: 'Order Test Category' }
        });
        categoryId = category.id;

        // Register user via API
        // Note: phone must match Turkish format /^(05\d{9})$/ per registerSchema
        const userRes = await request(app).post('/api/auth/register').send({
            name: 'Order Test',
            email: 'ordertest@example.com',
            password: 'Password1',       // min 6 chars + 1 uppercase + 1 digit
            phone: '05559998877',        // Turkish format: 05xxxxxxxxx
            consent: true               // required by registerSchema
        });
        userToken = userRes.body.token;

        // Store userId for cleanup
        const user = await prisma.user.findUnique({ where: { email: 'ordertest@example.com' } });
        if (user) userId = user.id;

        // Create test product
        const product = await prisma.product.create({
            data: {
                name: 'Order Test Product',
                description: 'Test',
                price: 100,
                stock: 10,
                categoryId: categoryId
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        // Cleanup in correct FK dependency order:
        // CartItems → Cart → OrderItems → Orders → Product → User → Category
        if (userId) {
            const cart = await prisma.cart.findUnique({ where: { userId } });
            if (cart) {
                await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
                await prisma.cart.delete({ where: { id: cart.id } });
            }
            await prisma.orderItem.deleteMany({ where: { order: { userId } } });
            await prisma.order.deleteMany({ where: { userId } });
        }
        if (productId) {
            await prisma.product.delete({ where: { id: productId } });
        }
        if (userId) {
            await prisma.user.delete({ where: { id: userId } });
        }
        if (categoryId) {
            await prisma.category.delete({ where: { id: categoryId } });
        }
        await prisma.$disconnect();
    });

    it('should create an order', async () => {
        // POST /api/orders requires: items[], fullName, phoneNumber (per createOrderSchema)
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                items: [{ id: productId, quantity: 1 }],
                fullName: 'Order Test',
                phoneNumber: '05559998877'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toEqual('PENDING');
    });
});
