const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    console.log('All products and orders deleted.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
