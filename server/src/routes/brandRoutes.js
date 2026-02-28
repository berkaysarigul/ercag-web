const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

const isAdmin = authorizeRole(['SUPER_ADMIN', 'ADMIN']);

// GET / — Tüm markalar
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;
        const where = active === 'true' ? { isActive: true } : {};

        const brands = await prisma.brand.findMany({
            where,
            include: { _count: { select: { products: { where: { isDeleted: false } } } } },
            orderBy: { name: 'asc' },
        });
        res.json(brands);
    } catch (error) {
        console.error('Get Brands Error:', error);
        res.status(500).json({ error: 'Markalar getirilemedi' });
    }
});

// POST / — Yeni marka
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, logo } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Marka adı gerekli' });

        const brand = await prisma.brand.create({
            data: { name: name.trim(), logo: logo || null },
        });
        res.status(201).json(brand);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Bu marka zaten mevcut' });
        res.status(500).json({ error: 'Marka oluşturulamadı' });
    }
});

// PUT /:id — Marka güncelle
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, logo, isActive } = req.body;
        const brand = await prisma.brand.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(logo !== undefined && { logo }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        res.json(brand);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Bu marka adı zaten mevcut' });
        res.status(500).json({ error: 'Marka güncellenemedi' });
    }
});

// DELETE /:id
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Marka silinmeden önce ürünlerdeki brandId null yap
        await prisma.product.updateMany({
            where: { brandId: parseInt(req.params.id) },
            data: { brandId: null },
        });
        await prisma.brand.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Marka silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Marka silinemedi' });
    }
});

module.exports = router;
