const globalPrisma = require('../lib/prisma');

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
        result = await globalPrisma.$transaction(async (tx) => {
            return await performOperations(tx);
        });
    }

    // Side effects (Notifications) - Should ideally run after commit, but running here for simplicity
    if (result.newStock <= result.product.lowStockThreshold && result.newStock > 0) {
        await checkLowStockAlert(result.product, result.newStock);
    }

    if (quantity > 0 && result.previousStock === 0) {
        await triggerStockAlerts(productId, result.product.name);
    }

    return { previousStock: result.previousStock, newStock: result.newStock };
};

const checkLowStockAlert = async (product, currentStock) => {
    // Admin'lere düşük stok bildirimi (Gelecekte Socket.io veya Email ile)
    console.log(`⚠️ Düşük stok uyarısı: ${product.name} — ${currentStock} adet kaldı`);
};

const triggerStockAlerts = async (productId, productName) => {
    try {
        const { sendStockAlertNotification } = require('./notificationService');
        const alerts = await prisma.stockAlert.findMany({
            where: { productId },
            include: { user: { select: { email: true } } }
        });

        for (const alert of alerts) {
            if (alert.user.email) {
                // notificationService implementasyonuna bağlı olarak değişebilir
                // Şimdilik sadece logluyoruz veya varsa fonksiyonu çağırıyoruz
                if (typeof sendStockAlertNotification === 'function') {
                    await sendStockAlertNotification(productName, alert.user.email);
                } else {
                    console.log(`Sending stock alert for ${productName} to ${alert.user.email}`);
                }
            }
        }

        // Alert'leri temizle
        await prisma.stockAlert.deleteMany({ where: { productId } });
    } catch (error) {
        console.error('Trigger Stock Alerts Error:', error);
    }
};

module.exports = { recordStockMovement };
