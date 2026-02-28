const prisma = require('../lib/prisma');
const crypto = require('crypto');
const { logAudit } = require('../services/auditService');
const { whatsappQueue } = require('../queues/whatsappQueue');
const { stockQueue } = require('../queues/stockQueue');

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

const { createOrderSchema } = require('../utils/validationSchemas');

const createOrder = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;

        const validation = createOrderSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Invalid input',
                details: validation.error.flatten().fieldErrors
            });
        }

        const { items, couponCode, fullName, phoneNumber, email, note, pickupRequestedTime, branchId } = validation.data;

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

        // ── Kampanya İndirimi ──
        const { applyActiveCampaigns } = require('./campaignController');

        // applyActiveCampaigns için item'lara product bilgisi ekle (categoryId gerekiyor)
        const itemsWithProduct = [];
        for (const item of orderItemsData) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { id: true, categoryId: true }
            });
            itemsWithProduct.push({
                ...item,
                productId: item.productId,
                product: product
            });
        }

        const campaignResult = await applyActiveCampaigns(itemsWithProduct);
        const campaignDiscount = Math.min(campaignResult.totalDiscount, totalAmount);
        const campaignDetails = campaignResult.appliedCampaigns;

        // Kampanya indirimini totalAmount'tan düş (kupon indirimi bunun üzerine uygulanacak)
        let afterCampaignTotal = totalAmount - Math.min(campaignDiscount, totalAmount);

        // Apply Coupon Logic
        let discountAmount = 0;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
            if (coupon && coupon.isActive) {
                if (!coupon.expirationDate || new Date() < coupon.expirationDate) {
                    if (afterCampaignTotal >= coupon.minOrderAmount) {
                        if (coupon.discountType === 'PERCENTAGE') {
                            discountAmount = (afterCampaignTotal * Number(coupon.discountValue)) / 100;
                        } else {
                            discountAmount = Number(coupon.discountValue);
                        }
                        discountAmount = Math.min(discountAmount, afterCampaignTotal);
                    }
                }
            }
        }

        const finalAmount = afterCampaignTotal - discountAmount;
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
                campaignDiscount,
                campaignDetails: campaignDetails.length > 0 ? JSON.stringify(campaignDetails) : null,
                status: 'PENDING',
                pickupCode,
                branchId: branchId ? parseInt(branchId) : null,
                statusHistory: JSON.stringify([{ status: 'PENDING', timestamp: new Date(), note: 'Sipariş oluşturuldu' }]),
                items: {
                    create: orderItemsData
                }
            },
            include: { items: true }
        });

        // Socket Notification
        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('new-order', {
                id: order.id,
                fullName,
                totalAmount: finalAmount,
                itemCount: items.length,
                createdAt: new Date()
            });
        }

        // Hediye Çarkı Otomatik Kod Üretimi
        let generatedSpinCode = null;
        try {
            const wheel = await prisma.spinWheel.findFirst({
                where: {
                    isActive: true,
                    isManualOnly: false,
                    minOrderAmount: { lte: finalAmount },
                    OR: [
                        { validUntil: null },
                        { validUntil: { gte: new Date() } },
                    ],
                },
                orderBy: { minOrderAmount: 'desc' },
            });

            if (wheel) {
                const newCodeStr = 'SPIN-' + crypto.randomBytes(3).toString('hex').toUpperCase();
                const code = await prisma.spinCode.create({
                    data: {
                        code: newCodeStr,
                        wheelId: wheel.id,
                        orderId: order.id,
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                });
                generatedSpinCode = code.code;
                console.log(`[SpinWheel] Otomatik Çark kodu üretildi: ${code.code} (Sipariş #${order.id}, Çark: ${wheel.name})`);
            }
        } catch (err) {
            console.error('Spin code autogeneration failed during createOrder:', err);
        }

        // 5. Asenkron WhatsApp Onay Mesajı (Kuyruk üzerinden)
        if (phoneNumber) {
            whatsappQueue.add('send-msg', {
                action: 'sendOrderConfirmation',
                payload: { phone: phoneNumber, orderId: order.id, pickupCode }
            }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 }
            });

            // Eğer çark kazanıldıysa ayrıca bir WhatsApp mesajı daha at
            if (generatedSpinCode) {
                const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                whatsappQueue.add('send-msg', {
                    action: 'sendSpinCode',
                    payload: { phone: phoneNumber, orderId: order.id, code: generatedSpinCode, spinUrl: `${appUrl}/spin` }
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 }
                });
            }
        }
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
            include: {
                items: { include: { product: true } },
                branch: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// FIX-14: Added pagination + status filter
const getAllOrders = async (req, res) => {
    try {
        const { search, status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let where = {};

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search } },
                { pickupCode: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } }
            ];
            if (!isNaN(search)) {
                where.OR.push({ id: parseInt(search) });
            }
        }

        const [total, orders] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                include: {
                    items: { include: { product: { select: { name: true, image: true } } } },
                    user: { select: { name: true, email: true, phone: true } },
                    branch: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            })
        ]);

        res.json({
            orders,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        });
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
            // But wait, orderController usually doesn't have transaction context easily passed to external service if not structured well.
            // stockService uses its own transaction. We should either pass prisma transaction to service or call service outside.
            // For now, let's keep it simple. If we use recordStockMovement, it has its own transaction. 
            // Better to move stock logic out of this transaction block or update service to accept tx.
            // Given the pattern, let's call recordStockMovement securely.
            // Correction: recordStockMovement uses prisma.$transaction internally. Nesting transactions is supported but let's be careful.
            // Actually, for consistency, let's remove the wrapping transaction here if it only covered this, 
            // OR update recordStockMovement to support external transaction.
            // Easier approach for this codebase: Call recordStockMovement individually.

            // To match request: "Use stockService.recordStockMovement"
            // Update: We are now offloading this to BullMQ `stockQueue` to avoid transaction locks
            // and API slowdowns during massive order processing streams.
            if ((status === 'PREPARING' || status === 'CONFIRMED') && order.status === 'PENDING') {
                stockQueue.add('update-stock', {
                    action: 'reduceStockOnOrder',
                    payload: { items: order.items, orderId: order.id, adminId: req.user.id }
                });
            } else if (status === 'CANCELLED' && (order.status !== 'PENDING' && order.status !== 'CANCELLED')) {
                // RESTOCK if cancelled after stock was reduced
                const { recordStockMovement } = require('../services/stockService');
                for (const item of order.items) {
                    await recordStockMovement(
                        item.productId,
                        'ADJUSTMENT',
                        item.quantity,
                        `Sipariş İptali #${order.id}`,
                        req.user.id,
                        tx // Pass transaction
                    );
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

        if (email || phone) {
            await sendOrderStatusNotification(order.id, status, email, phone, order.pickupCode);
        }

        const updatedOrder = await prisma.order.findUnique({ where: { id: parseInt(id) } });

        // Sipariş tamamlandığında loyalty puan ekle
        if (status === 'COMPLETED' && order.userId) {
            try {
                const { awardPointsForOrder } = require('./loyaltyController');
                await awardPointsForOrder(order.userId, Number(order.totalAmount), order.id);
            } catch (err) {
                console.error('Loyalty puan ekleme hatası:', err);
            }

            // Hediye çarkı kodu eskiden burada fetch ile üretiliyordu. Artık createOrder aşamasında veriliyor (satın alım anında).
            // Kod tekrarlanmaması için burası devre dışı bırakıldı.
        }

        // Socket Notification
        const io = req.app.get('io');
        if (io) {
            // To User
            if (order.userId) {
                io.to(`user-${order.userId}`).emit('order-status-update', {
                    orderId: order.id,
                    status,
                    pickupCode: order.pickupCode
                });
            }

            // To Admin
            io.to('admin-room').emit('order-updated', {
                orderId: parseInt(id),
                status,
                updatedBy: adminId
            });
        }

        res.json(updatedOrder);

        // Audit log — order status change
        logAudit(adminId, 'order.status_update', 'Order', parseInt(id), { oldStatus: order.status, newStatus: status }, req.ip);

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

const trackOrder = async (req, res) => {
    try {
        const { code } = req.params;
        const order = await prisma.order.findUnique({
            where: { pickupCode: code },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                readyAt: true,
                branch: { select: { name: true } },
                items: {
                    select: {
                        quantity: true,
                        product: { select: { name: true, image: true } }
                    }
                }
            }
        });

        if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
        res.json(order);
    } catch (error) {
        console.error('Track Order Error:', error);
        res.status(500).json({ error: 'Sorgulama başarısız' });
    }
};

/**
 * GET /api/orders/counts
 * Her durum için sipariş sayısını döner (tab badge'leri için)
 */
const getOrderCounts = async (req, res) => {
    try {
        const counts = await prisma.order.groupBy({
            by: ['status'],
            _count: true,
        });

        const result = { ALL: 0, PENDING: 0, PREPARING: 0, READY: 0, COMPLETED: 0, CANCELLED: 0 };
        counts.forEach(c => {
            result[c.status] = c._count;
            result.ALL += c._count;
        });

        res.json(result);
    } catch (error) {
        console.error('Order Counts Error:', error);
        res.status(500).json({ error: 'Sayaçlar alınamadı' });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    verifyPickupCode,
    cancelMyOrder,
    trackOrder,
    getOrderCounts
};
