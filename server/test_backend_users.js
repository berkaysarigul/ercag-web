const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing User Query...');
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log('Success. Found users:', users.length);
        // console.log(users);
    } catch (e) {
        console.error('Error executing query:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
