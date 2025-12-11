const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.update({
        where: { email: 'admin@ercag.com' },
        data: { role: 'SUPER_ADMIN' }
    });
    console.log('Updated Admin User Role to:', user.role);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
