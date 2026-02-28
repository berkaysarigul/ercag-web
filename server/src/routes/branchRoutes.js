const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

const isAdmin = authorizeRole(['SUPER_ADMIN', 'ADMIN']);

// GET / — Tüm şubeler (public — kullanıcılar sipariş verirken görecek)
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;
        const where = active === 'true' ? { isActive: true } : {};
        const branches = await prisma.branch.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Şubeler getirilemedi' });
    }
});

// POST / — Yeni şube (Admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, address, phone, district, city, latitude, longitude, workingHours } = req.body;
        if (!name?.trim() || !address?.trim()) {
            return res.status(400).json({ error: 'Şube adı ve adresi gerekli' });
        }
        const branch = await prisma.branch.create({
            data: {
                name: name.trim(),
                address: address.trim(),
                phone: phone || null,
                district: district || null,
                city: city || 'Afyonkarahisar',
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                workingHours: workingHours || null,
            },
        });
        res.status(201).json(branch);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Bu şube adı zaten mevcut' });
        res.status(500).json({ error: 'Şube oluşturulamadı' });
    }
});

// PUT /:id — Şube güncelle
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const branch = await prisma.branch.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
        });
        res.json(branch);
    } catch (error) {
        res.status(500).json({ error: 'Şube güncellenemedi' });
    }
});

// DELETE /:id
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderCount = await prisma.order.count({ where: { branchId: parseInt(req.params.id) } });
        if (orderCount > 0) {
            return res.status(400).json({ error: `Bu şubeye ait ${orderCount} sipariş var, silinemez. Pasif yapabilirsiniz.` });
        }
        await prisma.branch.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Şube silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Şube silinemedi' });
    }
});

module.exports = router;
