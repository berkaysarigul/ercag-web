const prisma = require('../lib/prisma');

// Point Calculation Config
const POINTS_PER_CURRENCY = 0.1; // 10 TL = 1 Point (1/10)
const POINT_VALUE = 0.1; // 1 Point = 0.1 TL (10 Points = 1 TL)
const REFERRAL_BONUS = 50;

const getLoyaltyStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        let loyalty = await prisma.loyaltyPoints.findUnique({
            where: { userId },
            include: { history: { orderBy: { createdAt: 'desc' }, take: 20 } }
        });

        if (!loyalty) {
            loyalty = await prisma.loyaltyPoints.create({ data: { userId } });
        }

        res.json(loyalty);
    } catch (error) {
        console.error('Loyalty Status Error:', error);
        res.status(500).json({ error: 'Failed to fetch loyalty status' });
    }
};

// Internal: Earn points from order
const awardPointsForOrder = async (userId, orderTotal, orderId) => {
    try {
        const pointsEarned = Math.floor(orderTotal * POINTS_PER_CURRENCY);
        if (pointsEarned <= 0) return;

        let loyalty = await prisma.loyaltyPoints.findUnique({ where: { userId } });
        if (!loyalty) {
            loyalty = await prisma.loyaltyPoints.create({ data: { userId } });
        }

        await prisma.$transaction([
            prisma.loyaltyPoints.update({
                where: { id: loyalty.id },
                data: { points: { increment: pointsEarned } }
            }),
            prisma.loyaltyHistory.create({
                data: {
                    loyaltyId: loyalty.id,
                    points: pointsEarned,
                    reason: `Sipariş #${orderId} Kazancı`
                }
            })
        ]);
    } catch (error) {
        console.error('Award Points Error:', error);
    }
};

// Internal: Spend points
const spendPoints = async (userId, pointsToSpend, orderId) => {
    try {
        const loyalty = await prisma.loyaltyPoints.findUnique({ where: { userId } });
        if (!loyalty || loyalty.points < pointsToSpend) {
            throw new Error('Yetersiz puan');
        }

        await prisma.$transaction([
            prisma.loyaltyPoints.update({
                where: { id: loyalty.id },
                data: { points: { decrement: pointsToSpend } }
            }),
            prisma.loyaltyHistory.create({
                data: {
                    loyaltyId: loyalty.id,
                    points: -pointsToSpend,
                    reason: `Sipariş #${orderId} Harcaması`
                }
            })
        ]);
        return true;
    } catch (error) {
        console.error('Spend Points Error:', error);
        return false;
    }
};

// Endpoint: Redeem points
const redeemPoints = async (req, res) => {
    res.status().json({ error: 'Not implemented yet' });
};

module.exports = {
    getLoyaltyStatus,
    awardPointsForOrder,
    spendPoints,
    redeemPoints,
    POINT_VALUE
};
