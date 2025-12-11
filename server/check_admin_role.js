const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@ercag.com' }
    });
    console.log('Admin User Role:', user ? user.role : 'User not found');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
