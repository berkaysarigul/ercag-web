const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

// Constants for Auth
const isAdmin = authorizeRole(['SUPER_ADMIN', 'ADMIN']);

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { products: true } } }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Kategoriler getirilemedi' });
    }
});

// Create category (Admin only) — FIX-12: removed non-existent slug/description fields
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, image } = req.body;
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Kategori adı gerekli' });
        }
        const category = await prisma.category.create({
            data: { name: name.trim(), image: image || null }
        });
        res.status(201).json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bu kategori adı zaten mevcut' });
        }
        res.status(500).json({ error: 'Kategori oluşturulamadı' });
    }
});

// Update category — FIX-12: removed non-existent fields
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image } = req.body;
        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name: name.trim() }),
                ...(image !== undefined && { image })
            }
        });
        res.json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bu kategori adı zaten mevcut' });
        }
        res.status(500).json({ error: 'Kategori güncellenemedi' });
    }
});

// Delete category
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.category.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Kategori silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Kategori silinemedi' });
    }
});

module.exports = router;
