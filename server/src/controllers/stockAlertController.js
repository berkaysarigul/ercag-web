const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createAlert = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        const existingAlert = await prisma.stockAlert.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId)
                }
            }
        });

        if (existingAlert) {
            return res.status(400).json({ error: 'Alert already exists for this product' });
        }

        const alert = await prisma.stockAlert.create({
            data: {
                userId,
                productId: parseInt(productId)
            }
        });

        res.status(201).json(alert);
    } catch (error) {
        console.error('Create Alert Error:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
};

const getAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        const alerts = await prisma.stockAlert.findMany({
            where: { userId },
            include: { product: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(alerts);
    } catch (error) {
        console.error('Get Alerts Error:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};

module.exports = { createAlert, getAlerts };
