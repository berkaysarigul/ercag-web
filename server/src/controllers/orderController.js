const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const generatePickupCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
        const existing = await prisma.order.findUnique({ where: { pickupCode: code } });
        if (!existing) isUnique = true;
    }
    return code;
};

const createOrder = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const { items, couponCode, fullName, phoneNumber, email, note, pickupRequestedTime } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        if (!fullName || !phoneNumber) {
            return res.status(400).json({ error: 'Ad Soyad ve Telefon zorunludur.' });
        }

        // Calculate total and verify prices
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } });
            if (!product) {
                return res.status(404).json({ error: `Product ${item.id} not found` });
            }
            // Optional: Check stock availability here before order
            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Yetersiz stok: ${product.name}` });
            }

            totalAmount += Number(product.price) * item.quantity;
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price
            });
        }

        // Apply Coupon Logic
        let discountAmount = 0;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
            if (coupon && coupon.isActive) {
                if (!coupon.expirationDate || new Date() < coupon.expirationDate) {
                    if (totalAmount >= coupon.minOrderAmount) {
                        if (coupon.discountType === 'PERCENTAGE') {
                            discountAmount = (totalAmount * Number(coupon.discountValue)) / 100;
                        } else {
                            discountAmount = Number(coupon.discountValue);
                        }
                        discountAmount = Math.min(discountAmount, totalAmount);
                    }
                }
            }
        }

        const finalAmount = totalAmount - discountAmount;
        const pickupCode = await generatePickupCode();

        const order = await prisma.order.create({
            data: {
                userId,
                fullName,
                phoneNumber,
                email,
                note,
                pickupRequestedTime,
                totalAmount: finalAmount,
                couponCode,
                discountAmount,
                status: 'PENDING',
                pickupCode,
                statusHistory: JSON.stringify([{ status: 'PENDING', timestamp: new Date(), note: 'Sipariş oluşturuldu' }]),
                items: {
                    create: orderItemsData
                }
            },
            include: { items: true }
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await prisma.order.findMany({
            where: { userId },
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        // Build filter based on search query
        const { search } = req.query;
        let where = {};

        if (search) {
            where = {
                OR: [
                    { id: !isNaN(search) ? parseInt(search) : undefined },
                    { fullName: { contains: search } },
                    { phoneNumber: { contains: search } },
                    { pickupCode: { contains: search } },
                    { user: { name: { contains: search } } } // Fallback to user account name
                ]
            };
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: { include: { product: true } },
                user: { select: { name: true, email: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const { sendOrderStatusNotification } = require('../services/notificationService');

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.user.id;

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                items: true,
                user: true
            }
        });

        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

        const ALLOWED_TRANSITIONS = {
            'PENDING': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['READY', 'CANCELLED'],
            'READY': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        };

        // Force Allow COMPLETED from any state if it's a Pickup Verification
        // But strictly speaking, standard flow is READY -> COMPLETED. 
        // We will keep standard flow for manual updates.

        if (!ALLOWED_TRANSITIONS[order.status]?.includes(status)) {
            // Exception: Allow forceful completion if needed? No, stick to rules for now to ensure consistency.
            return res.status(400).json({ error: `Geçersiz durum geçişi: ${order.status} -> ${status}` });
        }

        let history = [];
        try { history = JSON.parse(order.statusHistory || '[]'); } catch (e) { }
        history.push({
            status,
            timestamp: new Date(),
            changedBy: adminId,
            oldStatus: order.status
        });

        // Transaction for Stock Updates
        await prisma.$transaction(async (tx) => {
            // STOCK REDUCTION logic: When moving to PREPARING (or CONFIRMED in new specs)
            if ((status === 'PREPARING' || status === 'CONFIRMED') && order.status === 'PENDING') {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }
            // STOCK RESTORATION logic: When CANCELLED
            else if (status === 'CANCELLED' && order.status !== 'PENDING' && order.status !== 'CANCELLED') {
                // Check if we actually decremented stock previously (i.e. was PREPARING or READY or CONFIRMED)
                if (order.status === 'PREPARING' || order.status === 'READY') {
                    for (const item of order.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: item.quantity } }
                        });
                    }
                }
            }

            const updateData = {
                status,
                statusHistory: JSON.stringify(history),
                handledByUserId: adminId
            };

            if (status === 'READY') updateData.readyAt = new Date();
            if (status === 'COMPLETED') updateData.completedAt = new Date();

            await tx.order.update({
                where: { id: parseInt(id) },
                data: updateData
            });
        });

        // Send Notification AFTER transaction success
        // Use user email/phone from order details (snapshot) or fallback to user profile
        const email = order.email || order.user?.email;
        const phone = order.phoneNumber || order.user?.phone;

        if (email) {
            await sendOrderStatusNotification(order.id, status, email, phone);
        }

        const updatedOrder = await prisma.order.findUnique({ where: { id: parseInt(id) } });
        res.json(updatedOrder);

    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(400).json({ error: 'Stok yetersiz, işlem yapılamadı.' });
        }
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

const verifyPickupCode = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Kod gerekli' });

        const order = await prisma.order.findUnique({
            where: { pickupCode: code },
            include: {
                user: { select: { name: true, email: true, phone: true } },
                items: { include: { product: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Geçersiz teslimat kodu.' });
        }

        // Return full details including calculated total vs items total check?
        // Just return the order object for the frontend review page
        res.json({ success: true, order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to verify code' });
    }
};

const cancelMyOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) }
        });

        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
        if (order.userId !== userId) return res.status(403).json({ error: 'Bu sipariş size ait değil' });

        if (order.status !== 'PENDING') {
            return res.status(400).json({ error: 'Sadece "Bekliyor" durumundaki siparişler iptal edilebilir. Lütfen mağaza ile iletişime geçin.' });
        }

        let history = [];
        try { history = JSON.parse(order.statusHistory || '[]'); } catch (e) { }
        history.push({
            status: 'CANCELLED',
            timestamp: new Date(),
            changedBy: userId, // User themselves
            note: 'Kullanıcı tarafından iptal edildi'
        });

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: {
                status: 'CANCELLED',
                statusHistory: JSON.stringify(history)
            }
        });

        res.json(updatedOrder);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Sipariş iptal edilemedi' });
    }
};

module.exports = { createOrder, getUserOrders, getAllOrders, updateOrderStatus, verifyPickupCode, cancelMyOrder };
