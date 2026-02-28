const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.branch.upsert({
        where: { name: 'Uydukent Şubesi' },
        update: {},
        create: {
            name: 'Uydukent Şubesi',
            address: 'Uydukent, Selçuklu Mahallesi, Afyonkarahisar',
            district: 'Selçuklu Mah.',
            city: 'Afyonkarahisar',
            phone: '',
            isActive: true,
        },
    });

    await prisma.branch.upsert({
        where: { name: 'Fatih Şubesi' },
        update: {},
        create: {
            name: 'Fatih Şubesi',
            address: 'Fatih Mahallesi, Afyonkarahisar',
            district: 'Fatih Mah.',
            city: 'Afyonkarahisar',
            phone: '',
            isActive: true,
        },
    });

    console.log('Şubeler oluşturuldu.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
