const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // Fixed imports
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

// Create category (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, slug, description, image } = req.body;
        const category = await prisma.category.create({
            data: { name, slug, description, image }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Kategori oluşturulamadı' });
    }
});

// Update category
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image } = req.body;
        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name, slug, description, image }
        });
        res.json(category);
    } catch (error) {
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
