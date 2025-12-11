const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany();
    console.log('Total Categories:', categories.length);
    categories.forEach(c => console.log(`Cat ${c.id}: ${c.name}`));

    const products = await prisma.product.findMany();
    console.log('Total Products:', products.length);
    products.forEach(p => {
        console.log(`${p.id}: ${p.name} - ${p.price} TL (Cat: ${p.categoryId})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
