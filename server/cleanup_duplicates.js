const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { id: 'asc' }
        });

        // Group by name
        const grouped = {};
        products.forEach(p => {
            if (!grouped[p.name]) grouped[p.name] = [];
            grouped[p.name].push(p);
        });

        const idsToDelete = [];

        for (const name in grouped) {
            const group = grouped[name];
            if (group.length > 1) {
                console.log(`Found ${group.length} duplicates for: ${name}`);

                // Sort to find the best one to keep
                // Criteria: 
                // 1. Has Stock? (desc)
                // 2. Has Image? (desc)
                // 3. Oldest ID (asc) (Assuming original is better/more referenced)

                group.sort((a, b) => {
                    const stockDiff = b.stock - a.stock;
                    if (stockDiff !== 0) return stockDiff;

                    const imgA = a.image ? 1 : 0;
                    const imgB = b.image ? 1 : 0;
                    const imgDiff = imgB - imgA;
                    if (imgDiff !== 0) return imgDiff;

                    return a.id - b.id;
                });

                const toKeep = group[0];
                const toRemove = group.slice(1);

                console.log(`Keeping ID: ${toKeep.id} (Stock: ${toKeep.stock}, Img: ${toKeep.image ? 'Yes' : 'No'})`);
                toRemove.forEach(p => {
                    console.log(`  Deleting ID: ${p.id} (Stock: ${p.stock}, Img: ${p.image ? 'Yes' : 'No'})`);
                    idsToDelete.push(p.id);
                });
            }
        }

        if (idsToDelete.length > 0) {
            console.log('Processing deletions...');
            let deletedCount = 0;

            for (const id of idsToDelete) {
                // Check for orders (Critical constraint)
                const orderCount = await prisma.orderItem.count({ where: { productId: id } });
                if (orderCount > 0) {
                    console.warn(`SKIP: Cannot delete Product ID ${id} because it has ${orderCount} orders.`);
                    continue;
                }

                // Delete dependencies (Safe to remove for duplicates)
                console.log(`Cleaning dependencies for Product ID ${id}...`);

                // Use transaction to ensure clean removal
                await prisma.$transaction([
                    prisma.cartItem.deleteMany({ where: { productId: id } }),
                    prisma.wishlist.deleteMany({ where: { productId: id } }),
                    prisma.review.deleteMany({ where: { productId: id } }),
                    prisma.stockAlert.deleteMany({ where: { productId: id } }),
                    // ProductImage cascades, but let's be explicit if needed, though schema says Cascade.
                    // Finally delete product
                    prisma.product.delete({ where: { id } })
                ]);

                deletedCount++;
                console.log(`  Deleted Product ID ${id}`);
            }

            console.log(`Successfully processed deletions. Removed ${deletedCount} products.`);
        } else {
            console.log('No duplicates found/removed.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
