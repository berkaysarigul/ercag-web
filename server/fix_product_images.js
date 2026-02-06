const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting image sync...');
    const products = await prisma.product.findMany({
        include: { images: true }
    });

    for (const product of products) {
        if (product.images.length > 0) {
            // Pick the first image from the gallery
            const firstImage = product.images[0].url;

            // If current main image is different (or placeholder/null), update it
            if (product.image !== firstImage) {
                console.log(`Updating Product ${product.id} image: ${product.image} -> ${firstImage}`);
                await prisma.product.update({
                    where: { id: product.id },
                    data: { image: firstImage }
                });
            }
        }
    }
    console.log('Sync complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
