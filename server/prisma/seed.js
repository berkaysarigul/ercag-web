const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    // Create Categories
    const defterler = await prisma.category.upsert({
        where: { name: 'Defterler' },
        update: {},
        create: { name: 'Defterler', image: 'notebooks.jpg' },
    });

    const kalemler = await prisma.category.upsert({
        where: { name: 'Kalemler' },
        update: {},
        create: { name: 'Kalemler', image: 'pens.jpg' },
    });

    const ofis = await prisma.category.upsert({
        where: { name: 'Ofis Malzemeleri' },
        update: {},
        create: { name: 'Ofis Malzemeleri', image: 'office.jpg' },
    });

    // Create Products
    await prisma.product.createMany({
        data: [
            {
                name: 'Spiralli A4 Defter',
                description: '120 yaprak, kareli, sert kapak.',
                price: 45.90,
                categoryId: defterler.id,
            },
            {
                name: 'Tükenmez Kalem Seti (Mavi)',
                description: '5 adet mavi tükenmez kalem.',
                price: 25.00,
                categoryId: kalemler.id,
            },
            {
                name: 'A4 Fotokopi Kağıdı (500 Adet)',
                description: '80gr 1. hamur fotokopi kağıdı.',
                price: 120.00,
                categoryId: ofis.id,
            },
            {
                name: 'Resim Defteri 35x50',
                description: 'Spiralli resim defteri.',
                price: 35.50,
                categoryId: defterler.id,
            },
        ],
    });

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@ercag.com' },
        update: {
            password: adminPassword,
            role: 'ADMIN'
        },
        create: {
            email: 'admin@ercag.com',
            password: adminPassword,
            name: 'Admin User',
            phone: '5555555555',
            role: 'ADMIN'
        }
    });

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
