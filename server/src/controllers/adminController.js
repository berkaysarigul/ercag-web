const prisma = require('../lib/prisma');

const getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const totalOrders = await prisma.order.count();
        const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
        const totalProducts = await prisma.product.count();

        // 2. Revenue Calculation (Completed orders only)
        const revenueResult = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'COMPLETED' }
        });
        const totalRevenue = revenueResult._sum.totalAmount || 0;

        // 3. Trends (Compare with previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const previousMonthOrders = await prisma.order.count({
            where: { createdAt: { lt: thirtyDaysAgo } }
        });
        // Simple mock trend for now, real calculation is complex without more history
        // Or calculate current month vs previous month

        // 4. Chart Data (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days inc today

        const recentOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                status: 'COMPLETED'
            },
            select: {
                createdAt: true,
                totalAmount: true
            }
        });

        const chartData = {};
        // Initialize last 7 days with 0
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('tr-TR', { weekday: 'short' }); // Pzt, Sal
            chartData[dateStr] = 0;
        }

        // Fill with actual data
        recentOrders.forEach(order => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('tr-TR', { weekday: 'short' });
            if (chartData[dateStr] !== undefined) {
                chartData[dateStr] += Number(order.totalAmount);
            }
        });

        // Convert to array in correct order (reverse chronological was built, need chronological)
        // Actually, just building array for last 7 days in order
        const dailyRevenue = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toLocaleDateString('tr-TR', { weekday: 'short' });
            dailyRevenue.push({
                day: dateKey,
                revenue: chartData[dateKey] || 0
            });
        }

        res.json({
            totalOrders,
            pendingOrders,
            totalProducts,
            totalRevenue,
            chartData: dailyRevenue // Send this to frontend
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

const getDetailedStats = async (req, res) => {
    try {
        const { period } = req.query; // 'week', 'month', 'year'
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
            default: // month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // 1. En çok satan ürünler (Top 10)
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: { order: { status: 'COMPLETED', createdAt: { gte: startDate } } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 10
        });

        // Ürün isimlerini çek
        const productIds = topProducts.map(p => p.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true, image: true }
        });

        const topProductsWithNames = topProducts.map(tp => ({
            ...tp,
            product: products.find(p => p.id === tp.productId)
        }));

        // 2. Günlük satış trendi
        // Prisma aggregation is limited for date grouping, usually require raw query for efficiency
        // or fetching data and grouping in JS (fine for smaller datasets)
        // Let's use groupBy on createdAt if possible or raw query.
        // Prisma doesn't support grouping by date part easily without raw.
        // Using raw query for postgres.

        const dailySales = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, SUM("totalAmount") as revenue, COUNT(*) as count
            FROM "Order"
            WHERE status = 'COMPLETED' AND "createdAt" >= ${startDate}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        // 3. Kategori bazlı satışlar
        const categorySales = await prisma.$queryRaw`
            SELECT c.name as category, SUM(oi.quantity) as "totalQuantity", SUM(oi.price * oi.quantity) as "totalRevenue"
            FROM "OrderItem" oi
            JOIN "Product" p ON oi."productId" = p.id
            JOIN "Category" c ON p."categoryId" = c.id
            JOIN "Order" o ON oi."orderId" = o.id
            WHERE o.status = 'COMPLETED' AND o."createdAt" >= ${startDate}
            GROUP BY c.name
            ORDER BY "totalRevenue" DESC
        `;

        // 4. Ortalama sepet tutarı
        const avgOrder = await prisma.order.aggregate({
            _avg: { totalAmount: true },
            where: { status: 'COMPLETED', createdAt: { gte: startDate } }
        });

        // 5. Müşteri istatistikleri
        const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
        // Repeat customers: users with > 1 completed order
        const repeatCustomers = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM (
                SELECT "userId" FROM "Order"
                WHERE status = 'COMPLETED' AND "userId" IS NOT NULL
                GROUP BY "userId" HAVING COUNT(*) > 1
            ) sub
        `;

        // 6. Sipariş durumu dağılımı
        const orderStatusDistribution = await prisma.order.groupBy({
            by: ['status'],
            _count: true,
            where: { createdAt: { gte: startDate } }
        });

        // Serialize BigInt for JSON
        const serialize = (data) => JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(serialize({
            topProducts: topProductsWithNames,
            dailySales,
            categorySales,
            avgOrderAmount: avgOrder._avg.totalAmount || 0,
            totalCustomers,
            repeatCustomers: Number(repeatCustomers[0]?.count || 0),
            orderStatusDistribution
        }));

    } catch (error) {
        console.error('Detailed Stats Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};

module.exports = { getDashboardStats, getDetailedStats };

