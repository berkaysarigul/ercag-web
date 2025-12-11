const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { pickupCode: true }
    });
    console.log('LATEST_PICKUP_CODE:', order?.pickupCode);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
