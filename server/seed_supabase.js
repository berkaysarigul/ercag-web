const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { phone: '5551234567' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@ercag.com',
            phone: '5551234567',
            password: adminPassword,
            role: 'SUPER_ADMIN',
            isEmailVerified: true
        }
    });
    console.log('✅ Admin user created: admin@ercag.com / admin123');

    // 2. Create Categories
    const categories = ['Kırtasiye', 'Oyuncak', 'Sanat', 'Ofis'];
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat },
            update: {},
            create: { name: cat, image: 'https://placehold.co/100?text=' + cat }
        });
    }
    console.log('✅ Categories created');

    // 3. Create Sample Products
    const kirtasiye = await prisma.category.findUnique({ where: { name: 'Kırtasiye' } });
    if (kirtasiye) {
        await prisma.product.createMany({
            data: [
                {
                    name: 'Faber Castell 12\'li Boya Kalemi',
                    description: 'Yüksek kaliteli kuru boya seti.',
                    price: 125.90,
                    stock: 50,
                    categoryId: kirtasiye.id,
                    image: 'https://placehold.co/400?text=Boya+Kalemi'
                },
                {
                    name: 'A4 Fotokopi Kağıdı (500 Adet)',
                    description: '80gr 1. kalite fotokopi kağıdı.',
                    price: 180.00,
                    stock: 100,
                    categoryId: kirtasiye.id,
                    image: 'https://placehold.co/400?text=Kagit'
                }
            ]
        });
        console.log('✅ Sample products created');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
