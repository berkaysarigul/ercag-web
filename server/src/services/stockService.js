// FIX-05: Renamed globalPrisma to prisma
const prisma = require('../lib/prisma');

const recordStockMovement = async (productId, type, quantity, reason, createdBy = null, prismaClient = null) => {
    const performOperations = async (client) => {
        const product = await client.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error(`Product ${productId} not found`);

        const previousStock = product.stock;
        const newStock = previousStock + quantity;

        await client.product.update({
            where: { id: productId },
            data: { stock: newStock }
        });

        await client.stockMovement.create({
            data: { productId, type, quantity, previousStock, newStock, reason, createdBy }
        });

        return { previousStock, newStock, product };
    };

    let result;
    if (prismaClient) {
        result = await performOperations(prismaClient);
    } else {
        // FIX-05: was globalPrisma.$transaction
        result = await prisma.$transaction(async (tx) => {
            return await performOperations(tx);
        });
    }

    // Side effects (Notifications) - Should ideally run after commit, but running here for simplicity
    if (result.newStock <= result.product.lowStockThreshold && result.newStock > 0) {
        await checkLowStockAlert(result.product, result.newStock);
    }

    if (quantity > 0) {
        const tx = prismaClient || prisma;
        const updatedProduct = await tx.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, stock: true }
        });

        if (updatedProduct && updatedProduct.stock > 0) {
            const alerts = await tx.stockAlert.findMany({
                where: { productId, isNotified: false },
                include: { user: { select: { email: true, name: true } } }
            });

            if (alerts.length > 0) {
                const { sendStockAlertNotification } = require('./notificationService');
                for (const alert of alerts) {
                    if (alert.user?.email) {
                        try {
                            await sendStockAlertNotification(updatedProduct.name, alert.user.email);
                        } catch (e) { }
                    }
                }
                // Alert'leri bildirildi olarak işaretle
                await tx.stockAlert.updateMany({
                    where: { productId, isNotified: false },
                    data: { isNotified: true }
                });
            }
        }
    }

    return { previousStock: result.previousStock, newStock: result.newStock };
};

const checkLowStockAlert = async (product, currentStock) => {
    // Admin'lere düşük stok bildirimi (Gelecekte Socket.io veya Email ile)
    console.log(`⚠️ Düşük stok uyarısı: ${product.name} — ${currentStock} adet kaldı`);
};

module.exports = { recordStockMovement };
