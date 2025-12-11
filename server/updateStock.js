const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const updateResult = await prisma.product.updateMany({
            data: {
                stock: 100
            }
        });
        console.log(`Updated ${updateResult.count} products with stock 100.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
