const prisma = require('../lib/prisma');

/**
 * GET /api/orders/stats
 * Ana dashboard verisi — tek bir endpoint'ten tüm widget'ları besler
 */
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();

        // ═══ Dönem Hesaplama ═══
        // Bu ay
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        // Geçen ay
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        // Bu hafta (Pazartesi başlangıç)
        const todayDay = now.getDay(); // 0=Pazar
        const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() + mondayOffset);
        thisWeekStart.setHours(0, 0, 0, 0);

        // ═══ 1. Temel Sayaçlar ═══
        const [totalOrders, pendingOrders, preparingOrders, readyOrders, totalProducts, totalCustomers] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.order.count({ where: { status: 'PREPARING' } }),
            prisma.order.count({ where: { status: 'READY' } }),
            prisma.product.count({ where: { isDeleted: false } }),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
        ]);

        // ═══ 2. Gelir (Bu Ay vs Geçen Ay) ═══
        const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                _count: true,
                where: { status: 'COMPLETED', createdAt: { gte: thisMonthStart } }
            }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                _count: true,
                where: { status: 'COMPLETED', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
            }),
        ]);

        const currentRevenue = Number(thisMonthRevenue._sum.totalAmount || 0);
        const previousRevenue = Number(lastMonthRevenue._sum.totalAmount || 0);
        const revenueTrend = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : (currentRevenue > 0 ? 100 : 0);

        const currentOrderCount = thisMonthRevenue._count || 0;
        const previousOrderCount = lastMonthRevenue._count || 0;
        const orderTrend = previousOrderCount > 0 ? Math.round(((currentOrderCount - previousOrderCount) / previousOrderCount) * 100) : (currentOrderCount > 0 ? 100 : 0);

        // ═══ 3. Ortalama Sepet Tutarı ═══
        const avgOrderResult = await prisma.order.aggregate({
            _avg: { totalAmount: true },
            where: { status: 'COMPLETED' }
        });
        const avgOrderAmount = Number(avgOrderResult._avg.totalAmount || 0);

        // ═══ 4. Click & Collect Metrikleri ═══
        // Ort. hazırlık süresi: createdAt → readyAt (son 30 gün, readyAt olan siparişler)
        const recentReadyOrders = await prisma.order.findMany({
            where: {
                readyAt: { not: null },
                createdAt: { gte: lastMonthStart }
            },
            select: { createdAt: true, readyAt: true }
        });

        let avgPrepMinutes = 0;
        if (recentReadyOrders.length > 0) {
            const totalMinutes = recentReadyOrders.reduce((sum, o) => {
                const diff = (new Date(o.readyAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
                return sum + diff;
            }, 0);
            avgPrepMinutes = Math.round(totalMinutes / recentReadyOrders.length);
        }

        // Teslim alım oranı: COMPLETED / (COMPLETED + CANCELLED) son 30 gün
        const [completedCount, cancelledCount] = await Promise.all([
            prisma.order.count({ where: { status: 'COMPLETED', createdAt: { gte: lastMonthStart } } }),
            prisma.order.count({ where: { status: 'CANCELLED', createdAt: { gte: lastMonthStart } } }),
        ]);
        const pickupRate = (completedCount + cancelledCount) > 0
            ? Math.round((completedCount / (completedCount + cancelledCount)) * 100) : 100;

        // ═══ 5. Haftalık Gelir Grafiği (Son 7 Gün) ═══
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weekOrders = await prisma.order.findMany({
            where: { status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true, totalAmount: true }
        });

        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('tr-TR', { weekday: 'short' });
            const dateKey = d.toISOString().split('T')[0];
            const dayRevenue = weekOrders
                .filter(o => new Date(o.createdAt).toISOString().split('T')[0] === dateKey)
                .reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const dayCount = weekOrders
                .filter(o => new Date(o.createdAt).toISOString().split('T')[0] === dateKey).length;
            chartData.push({ day: dateStr, revenue: Math.round(dayRevenue * 100) / 100, orders: dayCount });
        }

        // ═══ 6. Sipariş Durumu Dağılımı ═══
        const statusGroups = await prisma.order.groupBy({
            by: ['status'],
            _count: true,
        });
        const statusDistribution = statusGroups.map(g => ({
            status: g.status,
            count: g._count,
        }));

        // ═══ 7. Düşük Stok Ürünler (Eşiğin altında olanlar) ═══
        const lowStockProducts = await prisma.product.findMany({
            where: {
                isDeleted: false,
                stock: { lte: prisma.product.fields?.lowStockThreshold || 5 }
                // Prisma field comparison not supported easily. Use raw or fetch all and filter.
            },
            select: { id: true, name: true, stock: true, lowStockThreshold: true, sku: true, image: true },
            orderBy: { stock: 'asc' },
            take: 50
        });
        // Client-side filter (Prisma can't compare two columns without raw query easily)
        const filteredLowStock = lowStockProducts.filter(p => p.stock <= (p.lowStockThreshold || 5));

        // ═══ 8. En Çok Satan Ürünler (Son 30 gün) ═══
        const topProductGroups = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: { order: { status: 'COMPLETED', createdAt: { gte: lastMonthStart } } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });

        const topProductIds = topProductGroups.map(g => g.productId);
        const topProductDetails = await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, price: true, image: true, stock: true }
        });

        const topProducts = topProductGroups.map(g => ({
            productId: g.productId,
            totalSold: g._sum.quantity,
            product: topProductDetails.find(p => p.id === g.productId) || null
        }));

        // ═══ 9. Bugünkü Özet ═══
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const [todayOrders, todayRevenue] = await Promise.all([
            prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { status: 'COMPLETED', createdAt: { gte: todayStart } }
            }),
        ]);

        // ═══ Response ═══
        res.json({
            // KPI kartları
            totalRevenue: currentRevenue,
            revenueTrend,
            totalOrders,
            thisMonthOrders: currentOrderCount,
            orderTrend,
            totalProducts,
            totalCustomers,
            avgOrderAmount: Math.round(avgOrderAmount * 100) / 100,

            // Bekleyen işler (aksiyon gerektiren)
            pendingOrders,
            preparingOrders,
            readyOrders,
            actionRequired: pendingOrders + preparingOrders + readyOrders,

            // Click & Collect metrikleri
            avgPrepMinutes,
            pickupRate,

            // Grafikler
            chartData,
            statusDistribution,

            // Listeler
            lowStockProducts: filteredLowStock.slice(0, 8),
            lowStockCount: filteredLowStock.length,
            topProducts,

            // Bugün
            todayOrders,
            todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Dashboard verileri alınamadı' });
    }
};

/**
 * GET /api/orders/stats/detailed
 * Detaylı analitik (ayrı sayfa için hazır)
 */
const getDetailedStats = async (req, res) => {
    try {
        const { period } = req.query;
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const [topProducts, categorySales, avgOrder, orderStatusDist] = await Promise.all([
            // En çok satan ürünler
            prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                where: { order: { status: 'COMPLETED', createdAt: { gte: startDate } } },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),
            // Kategori bazlı satışlar
            prisma.$queryRaw`
                SELECT c.name as category, COALESCE(SUM(oi.quantity), 0) as "totalQuantity",
                       COALESCE(SUM(oi.price * oi.quantity), 0) as "totalRevenue"
                FROM "OrderItem" oi
                JOIN "Product" p ON oi."productId" = p.id
                JOIN "Category" c ON p."categoryId" = c.id
                JOIN "Order" o ON oi."orderId" = o.id
                WHERE o.status = 'COMPLETED' AND o."createdAt" >= ${startDate}
                GROUP BY c.name ORDER BY "totalRevenue" DESC
            `,
            // Ort sepet tutarı
            prisma.order.aggregate({
                _avg: { totalAmount: true },
                where: { status: 'COMPLETED', createdAt: { gte: startDate } }
            }),
            // Durum dağılımı
            prisma.order.groupBy({
                by: ['status'],
                _count: true,
                where: { createdAt: { gte: startDate } }
            }),
        ]);

        // Ürün isimlerini çek
        const productIds = topProducts.map(p => p.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true, image: true }
        });

        const serialize = (data) => JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? Number(value) : value
        ));

        res.json(serialize({
            topProducts: topProducts.map(tp => ({
                ...tp,
                product: products.find(p => p.id === tp.productId)
            })),
            categorySales,
            avgOrderAmount: avgOrder._avg.totalAmount || 0,
            orderStatusDistribution: orderStatusDist,
        }));
    } catch (error) {
        console.error('Detailed Stats Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};

module.exports = { getDashboardStats, getDetailedStats };

