const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        console.log('Total users:', count);

        const admin = await prisma.user.findUnique({
            where: { email: 'admin@ercag.com' }
        });

        if (admin) {
            console.log('ADMIN FOUND:', admin.email);
            console.log('Role:', admin.role);
            console.log('Password hash:', admin.password.substring(0, 10) + '...');
        } else {
            console.log('ADMIN NOT FOUND');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
