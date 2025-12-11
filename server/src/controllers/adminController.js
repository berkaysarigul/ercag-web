const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
    try {
        const totalOrders = await prisma.order.count();
        const pendingOrders = await prisma.order.count({
            where: { status: 'PENDING' }
        });
        const totalProducts = await prisma.product.count();
        const totalRevenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'COMPLETED' }
        });

        res.json({
            totalOrders,
            pendingOrders,
            totalProducts,
            totalRevenue: totalRevenue._sum.totalAmount || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

module.exports = { getDashboardStats };
