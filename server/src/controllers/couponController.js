const prisma = require('../lib/prisma');

const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderAmount, expirationDate } = req.body;

        const existingCoupon = await prisma.coupon.findUnique({ where: { code } });
        if (existingCoupon) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                discountType, // PERCENTAGE or FIXED
                discountValue: parseFloat(discountValue),
                minOrderAmount: parseFloat(minOrderAmount || 0),
                expirationDate: expirationDate ? new Date(expirationDate) : null
            }
        });

        res.status(201).json(coupon);
    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

        if (!coupon) {
            return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ valid: false, message: 'Coupon is inactive' });
        }

        if (coupon.expirationDate && new Date() > coupon.expirationDate) {
            return res.status(400).json({ valid: false, message: 'Coupon has expired' });
        }

        if (cartTotal < coupon.minOrderAmount) {
            return res.status(400).json({
                valid: false,
                message: `Minimum order amount is ${coupon.minOrderAmount} ₺`
            });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (cartTotal * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, cartTotal);

        res.json({
            valid: true,
            discountAmount,
            couponCode: coupon.code,
            message: 'Coupon applied successfully'
        });

    } catch (error) {
        console.error('Validate Coupon Error:', error);
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
};

const getCoupons = async (req, res) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(coupons);
    } catch (error) {
        console.error('Get Coupons Error:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
};

module.exports = { createCoupon, validateCoupon, getCoupons };
