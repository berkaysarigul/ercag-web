const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const slides = await prisma.heroSlide.findMany({
            orderBy: { id: 'desc' },
            take: 5
        });
        console.log('Recent Slides:', JSON.stringify(slides, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
