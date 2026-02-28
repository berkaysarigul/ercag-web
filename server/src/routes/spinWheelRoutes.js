const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const crypto = require('crypto');

const isAdmin = authorizeRole(['SUPER_ADMIN', 'ADMIN']);

// ═══ ÇARK YÖNETİMİ (Admin) ═══

// GET /wheels — Tüm çarklar
router.get('/wheels', authenticateToken, isAdmin, async (req, res) => {
    try {
        const wheels = await prisma.spinWheel.findMany({
            include: {
                prizes: { orderBy: { sortOrder: 'asc' } },
                _count: { select: { codes: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(wheels);
    } catch (error) {
        res.status(500).json({ error: 'Çarklar getirilemedi' });
    }
});

// POST /wheels — Yeni çark
router.post('/wheels', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, minOrderAmount, isManualOnly, validFrom, validUntil, prizes } = req.body;

        if (!name?.trim()) return res.status(400).json({ error: 'Çark adı gerekli' });
        if (!prizes || prizes.length < 2) return res.status(400).json({ error: 'En az 2 ödül dilimi gerekli' });

        const totalProb = prizes.reduce((s, p) => s + (parseFloat(p.probability) || 0), 0);
        if (Math.abs(totalProb - 1.0) > 0.01) {
            return res.status(400).json({ error: `Toplam olasılık 1.0 (100%) olmalı. Şu an: ${(totalProb * 100).toFixed(1)}%` });
        }

        const wheel = await prisma.spinWheel.create({
            data: {
                name: name.trim(),
                minOrderAmount: parseFloat(minOrderAmount) || 0,
                isManualOnly: isManualOnly || false,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null,
                prizes: {
                    create: prizes.map((p, idx) => ({
                        name: p.name,
                        type: p.type || 'EMPTY',
                        value: p.value || null,
                        probability: parseFloat(p.probability),
                        color: p.color || null,
                        icon: p.icon || null,
                        maxWins: p.maxWins ? parseInt(p.maxWins) : null,
                        sortOrder: idx,
                    })),
                },
            },
            include: { prizes: true },
        });
        res.status(201).json(wheel);
    } catch (error) {
        console.error('Create Wheel Error:', error);
        res.status(500).json({ error: 'Çark oluşturulamadı' });
    }
});

// PUT /wheels/:id
router.put('/wheels/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, minOrderAmount, isActive, isManualOnly, validFrom, validUntil } = req.body;
        const wheel = await prisma.spinWheel.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(name && { name }),
                ...(minOrderAmount !== undefined && { minOrderAmount: parseFloat(minOrderAmount) }),
                ...(isActive !== undefined && { isActive }),
                ...(isManualOnly !== undefined && { isManualOnly }),
                ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
                ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
            },
        });
        res.json(wheel);
    } catch (error) { res.status(500).json({ error: 'Güncellenemedi' }); }
});

// DELETE /wheels/:id
router.delete('/wheels/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await prisma.spinWheel.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Çark silindi' });
    } catch (error) { res.status(500).json({ error: 'Silinemedi' }); }
});

// ═══ ÖDÜL YÖNETİMİ ═══

// PUT /prizes/:id
router.put('/prizes/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const prize = await prisma.spinPrize.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
        });
        res.json(prize);
    } catch (error) { res.status(500).json({ error: 'Güncellenemedi' }); }
});

// ═══ KOD OLUŞTURMA ═══

function generateSpinCode() {
    return 'SPIN-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// POST /codes/generate — Manuel kod üretme (Admin)
router.post('/codes/generate', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { wheelId, customerNote } = req.body;
        if (!wheelId) return res.status(400).json({ error: 'Çark seçimi gerekli' });

        const wheel = await prisma.spinWheel.findUnique({ where: { id: parseInt(wheelId) } });
        if (!wheel || !wheel.isActive) return res.status(400).json({ error: 'Çark aktif değil' });

        const code = await prisma.spinCode.create({
            data: {
                code: generateSpinCode(),
                wheelId: parseInt(wheelId),
                createdById: req.user.id,
                customerNote: customerNote || null,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        res.status(201).json(code);
    } catch (error) {
        console.error('Generate Code Error:', error);
        res.status(500).json({ error: 'Kod oluşturulamadı' });
    }
});

// POST /codes/generate-for-order — Sipariş tamamlandığında otomatik
router.post('/codes/generate-for-order', authenticateToken, async (req, res) => {
    try {
        const { orderId, orderAmount } = req.body;

        const wheel = await prisma.spinWheel.findFirst({
            where: {
                isActive: true,
                isManualOnly: false,
                minOrderAmount: { lte: parseFloat(orderAmount) },
                OR: [
                    { validUntil: null },
                    { validUntil: { gte: new Date() } },
                ],
            },
            orderBy: { minOrderAmount: 'desc' },
        });

        if (!wheel) return res.json({ generated: false, message: 'Uygun çark yok' });

        const code = await prisma.spinCode.create({
            data: {
                code: generateSpinCode(),
                wheelId: wheel.id,
                orderId: parseInt(orderId),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        res.status(201).json({ generated: true, code: code.code, wheelName: wheel.name });
    } catch (error) {
        console.error('Auto Generate Code Error:', error);
        res.status(500).json({ error: 'Kod oluşturulamadı' });
    }
});

// GET /codes — Kod listesi (Admin)
router.get('/codes', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { wheelId, isUsed } = req.query;
        const where = {};
        if (wheelId) where.wheelId = parseInt(wheelId);
        if (isUsed !== undefined) where.isUsed = isUsed === 'true';

        const codes = await prisma.spinCode.findMany({
            where,
            include: {
                wheel: { select: { name: true } },
                prize: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json(codes);
    } catch (error) { res.status(500).json({ error: 'Kodlar getirilemedi' }); }
});

// ═══ ÇARK ÇEVİRME (Kullanıcı) ═══

// POST /spin — Çark çevir
router.post('/spin', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code?.trim()) return res.status(400).json({ error: 'Kod gerekli' });

        const spinCode = await prisma.spinCode.findUnique({
            where: { code: code.trim().toUpperCase() },
            include: {
                wheel: {
                    include: { prizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
                },
            },
        });

        if (!spinCode) return res.status(404).json({ error: 'Geçersiz kod' });
        if (spinCode.isUsed) return res.status(400).json({ error: 'Bu kod zaten kullanılmış' });
        if (spinCode.expiresAt && new Date() > spinCode.expiresAt) return res.status(400).json({ error: 'Bu kodun süresi dolmuş' });
        if (!spinCode.wheel.isActive) return res.status(400).json({ error: 'Bu çark artık aktif değil' });

        const prizes = spinCode.wheel.prizes;
        let rand = Math.random();
        let selectedPrize = prizes[prizes.length - 1];

        for (const prize of prizes) {
            rand -= prize.probability;
            if (rand <= 0) {
                if (prize.maxWins && prize.winCount >= prize.maxWins) continue;
                selectedPrize = prize;
                break;
            }
        }

        await prisma.$transaction([
            prisma.spinCode.update({
                where: { id: spinCode.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    userId: req.user.id,
                    prizeId: selectedPrize.id,
                    prizeResult: JSON.stringify({
                        name: selectedPrize.name,
                        type: selectedPrize.type,
                        value: selectedPrize.value,
                    }),
                },
            }),
            prisma.spinPrize.update({
                where: { id: selectedPrize.id },
                data: { winCount: { increment: 1 } },
            }),
        ]);

        if (selectedPrize.type === 'COUPON' && selectedPrize.value) {
            const couponCode = `SPIN-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            try {
                await prisma.coupon.create({
                    data: {
                        code: couponCode,
                        discountType: 'FIXED',
                        discountValue: parseFloat(selectedPrize.value),
                        isActive: true,
                        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                });
                return res.json({
                    prize: selectedPrize,
                    prizeIndex: prizes.indexOf(selectedPrize),
                    couponCode,
                    message: `Tebrikler! ${selectedPrize.name} kazandınız. Kupon kodunuz: ${couponCode}`,
                });
            } catch { /* kupon hatası - yine de ödül ver */ }
        }

        if (selectedPrize.type === 'POINTS' && selectedPrize.value) {
            const points = parseInt(selectedPrize.value);
            try {
                await prisma.loyaltyPoints.upsert({
                    where: { userId: req.user.id },
                    update: { points: { increment: points } },
                    create: { userId: req.user.id, points },
                });
            } catch { /* puan hatası */ }
        }

        res.json({
            prize: selectedPrize,
            prizeIndex: prizes.indexOf(selectedPrize),
            message: selectedPrize.type === 'EMPTY'
                ? 'Maalesef bu sefer kazanamadınız. Bir dahaki sefere!'
                : `Tebrikler! ${selectedPrize.name} kazandınız!`,
        });
    } catch (error) {
        console.error('Spin Error:', error);
        res.status(500).json({ error: 'Çark çevirme hatası' });
    }
});

// GET /wheel-info/:code — Çark bilgisi (UI için — olasılıklar gizli)
router.get('/wheel-info/:code', async (req, res) => {
    try {
        const spinCode = await prisma.spinCode.findUnique({
            where: { code: req.params.code.toUpperCase() },
            include: {
                wheel: {
                    include: {
                        prizes: {
                            where: { isActive: true },
                            select: { id: true, name: true, color: true, icon: true },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });

        if (!spinCode) return res.status(404).json({ error: 'Geçersiz kod' });
        if (spinCode.isUsed) return res.status(400).json({ error: 'Bu kod zaten kullanılmış', used: true });
        if (spinCode.expiresAt && new Date() > spinCode.expiresAt) return res.status(400).json({ error: 'Kodun süresi dolmuş' });

        res.json({
            wheelName: spinCode.wheel.name,
            prizes: spinCode.wheel.prizes,
        });
    } catch (error) { res.status(500).json({ error: 'Çark bilgisi alınamadı' }); }
});

module.exports = router;
