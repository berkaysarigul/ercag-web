const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.heroSlide.count();
        if (count === 0) {
            console.log('No slides found. Creating a default slide...');
            await prisma.heroSlide.create({
                data: {
                    title: 'Hoş Geldiniz',
                    subtitle: 'Erçağ Kırtasiye',
                    description: 'Yeni sezon ürünlerimizi keşfedin.',
                    imageUrl: 'default-slide.jpg', // We need to make sure this file exists or is handled
                    link: '/products',
                    order: 1,
                    isActive: true
                }
            });
            console.log('Default slide created.');
        } else {
            console.log(`Found ${count} slides.`);
            const activeCount = await prisma.heroSlide.count({ where: { isActive: true } });
            console.log(`Found ${activeCount} ACTIVE slides.`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
