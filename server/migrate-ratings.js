const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting rating migration...');
    const products = await prisma.product.findMany({
        include: { reviews: true }
    });

    for (const product of products) {
        const numReviews = product.reviews.length;
        const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0);
        const avgRating = numReviews > 0 ? totalRating / numReviews : 0;

        await prisma.product.update({
            where: { id: product.id },
            data: {
                rating: avgRating,
                numReviews: numReviews
            }
        });
        console.log(`Updated Product ${product.id}: Rating ${avgRating}, Reviews ${numReviews}`);
    }

    console.log('Migration completed.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
