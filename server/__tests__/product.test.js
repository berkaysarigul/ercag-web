const request = require('supertest');
const app = require('../index');
const prisma = require('../src/lib/prisma');

describe('Ürün Endpoint\'leri', () => {
    let adminToken, adminId;
    let categoryId, productId;

    beforeAll(async () => {
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');

        const stale = await prisma.user.findUnique({ where: { email: 'test_product_admin@test.com' } });
        if (stale) {
            await prisma.auditLog.deleteMany({ where: { userId: stale.id } });
            await prisma.user.delete({ where: { id: stale.id } });
        }
        await prisma.product.deleteMany({ where: { name: { startsWith: 'TEST_PROD_' } } });
        await prisma.category.deleteMany({ where: { name: 'TEST_PROD_CAT' } });

        const admin = await prisma.user.create({
            data: { name: 'Prod Admin', email: 'test_product_admin@test.com', password: await bcrypt.hash('Admin123', 10), phone: '05550000040', role: 'ADMIN' }
        });
        adminId = admin.id;
        adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const cat = await prisma.category.create({ data: { name: 'TEST_PROD_CAT' } });
        categoryId = cat.id;
    });

    afterAll(async () => {
        await prisma.product.deleteMany({ where: { name: { startsWith: 'TEST_PROD_' } } });
        await prisma.category.deleteMany({ where: { name: 'TEST_PROD_CAT' } });
        await prisma.auditLog.deleteMany({ where: { userId: adminId } });
        await prisma.user.deleteMany({ where: { id: adminId } });
        await prisma.$disconnect();
    });

    test('Ürün listesi public erişilebilir olmalı', async () => {
        const res = await request(app).get('/api/products');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.products)).toBe(true);
    });

    test('Admin ürün oluşturabilmeli', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .field('name', 'TEST_PROD_KALEM')
            .field('description', 'Test kalem açıklaması')
            .field('price', '15.50')
            .field('categoryId', categoryId.toString())
            .field('stock', '100');
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('TEST_PROD_KALEM');
        productId = res.body.id;
    });

    test('Tek ürün detayı alınabilmeli', async () => {
        const res = await request(app).get(`/api/products/${productId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(productId);
        expect(res.body.category).toBeTruthy();
    });

    test('Olmayan ürün 404 dönmeli', async () => {
        const res = await request(app).get('/api/products/999999');
        expect(res.statusCode).toBe(404);
    });

    test('Admin ürün güncelleyebilmeli', async () => {
        const res = await request(app)
            .put(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .field('name', 'TEST_PROD_KALEM_UPDATED')
            .field('price', '18.00');
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('TEST_PROD_KALEM_UPDATED');
    });

    test('Admin ürün silebilmeli (soft delete)', async () => {
        const res = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('Arama önerileri çalışmalı', async () => {
        // Create a product to search for
        await prisma.product.create({
            data: { name: 'TEST_PROD_SEARCH_DEFTER', description: 'Arama testi', price: 25, stock: 10, categoryId }
        });

        const res = await request(app).get('/api/products/search/suggestions?q=defter');
        expect(res.statusCode).toBe(200);
    });
});
