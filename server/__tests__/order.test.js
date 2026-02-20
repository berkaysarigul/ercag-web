const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

let userToken;
let productId;

describe('Order Endpoints', () => {
    beforeAll(async () => {
        // Create User
        await prisma.user.deleteMany({ where: { email: 'ordertest@example.com' } });
        const userRes = await request(app).post('/api/auth/register').send({
            name: 'Order Test',
            email: 'ordertest@example.com',
            password: 'password123',
            phone: '5559998877'
        });
        userToken = userRes.body.token;

        // Create Product
        const product = await prisma.product.create({
            data: {
                name: 'Test Product',
                description: 'Desc',
                price: 100,
                stock: 10,
                images: [],
                categoryId: 1 // Assuming category 1 exists or using connect logic if needed. 
                // Ideally we create a category too, but keeping it simple for now. 
                // If category requirement is strict, this might fail.
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.orderItem.deleteMany({ where: { product: { name: 'Test Product' } } });
        await prisma.order.deleteMany({ where: { user: { email: 'ordertest@example.com' } } });
        await prisma.product.delete({ where: { id: productId } });
        await prisma.user.deleteMany({ where: { email: 'ordertest@example.com' } });
        await prisma.$disconnect();
    });

    it('should create an order', async () => {
        // Add to cart first (assuming cart logic is implicit or we can create order directly via endpoint if exposed)
        // Since typical flow is Cart -> Order, let's try creating order from cart
        // But if we test /api/orders, it might require a Cart.

        // Let's seed a CartItem
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
            .send({
                paymentMethod: 'CREDIT_CARD'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toEqual('PENDING');
    });

    // More tests (status transition) would go here
});
