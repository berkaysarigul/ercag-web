const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Update the default slide to use an existing image
        // Using one found in the uploads directory: 1765062759008-278498872.jpeg
        const updated = await prisma.heroSlide.updateMany({
            where: { imageUrl: 'default-slide.jpg' },
            data: { imageUrl: '1765062759008-278498872.jpeg' }
        });
        console.log(`Updated ${updated.count} slides to use valid image.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
