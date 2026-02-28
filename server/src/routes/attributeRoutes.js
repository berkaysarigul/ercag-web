const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

const isAdmin = authorizeRole(['SUPER_ADMIN', 'ADMIN']);

// ═══ ÖZELLİK TİPLERİ ═══

// GET /types — Tüm özellik tipleri + değerleri
router.get('/types', async (req, res) => {
    try {
        const types = await prisma.attributeType.findMany({
            include: {
                values: { orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }] },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Özellik tipleri getirilemedi' });
    }
});

// POST /types — Yeni özellik tipi
router.post('/types', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Tip adı gerekli' });
        const type = await prisma.attributeType.create({ data: { name: name.trim() } });
        res.status(201).json(type);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Bu özellik tipi zaten mevcut' });
        res.status(500).json({ error: 'Oluşturulamadı' });
    }
});

// PUT /types/:id
router.put('/types/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const type = await prisma.attributeType.update({
            where: { id: parseInt(req.params.id) },
            data: { name: req.body.name?.trim(), sortOrder: req.body.sortOrder },
        });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Güncellenemedi' });
    }
});

// DELETE /types/:id
router.delete('/types/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await prisma.attributeType.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Silindi' });
    } catch (error) {
        if (error.code === 'P2003') return res.status(400).json({ error: 'Bu tipe ait değerler kullanımda' });
        res.status(500).json({ error: 'Silinemedi' });
    }
});

// ═══ ÖZELLİK DEĞERLERİ ═══

// POST /values — Yeni değer
router.post('/values', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { attributeTypeId, value, colorHex } = req.body;
        const val = await prisma.attributeValue.create({
            data: {
                attributeTypeId: parseInt(attributeTypeId),
                value: value.trim(),
                colorHex: colorHex || null,
            },
        });
        res.status(201).json(val);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Bu değer zaten mevcut' });
        res.status(500).json({ error: 'Oluşturulamadı' });
    }
});

// PUT /values/:id
router.put('/values/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const val = await prisma.attributeValue.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
        });
        res.json(val);
    } catch (error) {
        res.status(500).json({ error: 'Güncellenemedi' });
    }
});

// DELETE /values/:id
router.delete('/values/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await prisma.attributeValue.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Silindi' });
    } catch (error) {
        if (error.code === 'P2003') return res.status(400).json({ error: 'Bu değer varyantlarda kullanımda' });
        res.status(500).json({ error: 'Silinemedi' });
    }
});

module.exports = router;
