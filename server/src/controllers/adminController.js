const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

module.exports = { getDashboardStats };

