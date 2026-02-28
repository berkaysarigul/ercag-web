const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

const isAdmin = authorizeRole(['SUPER_ADMIN', 'ADMIN']);

// ═══ GET / — Tüm kategoriler (ağaç yapısında veya flat) ═══
router.get('/', async (req, res) => {
    try {
        const { flat } = req.query; // ?flat=true → düz liste

        if (flat === 'true') {
            const categories = await prisma.category.findMany({
                include: { _count: { select: { products: true } } },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            });
            return res.json(categories);
        }

        // Ağaç yapısı: sadece ana kategoriler + children
        const categories = await prisma.category.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        _count: { select: { products: true } },
                    },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                },
                _count: { select: { products: true } },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.json(categories);
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({ error: 'Kategoriler getirilemedi' });
    }
});

// ═══ GET /mega-menu — Mega menü verisi ═══
router.get('/mega-menu', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        _count: { select: { products: { where: { isDeleted: false } } } },
                    },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                },
                products: {
                    where: { isDeleted: false },
                    select: { id: true, name: true, price: true, image: true },
                    take: 6,
                    orderBy: { createdAt: 'desc' },
                },
                _count: { select: { products: { where: { isDeleted: false } } } },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });

        // Her ana kategori için children'daki ürün sayılarını da topla
        const enriched = categories.map(cat => ({
            ...cat,
            totalProducts: cat._count.products + cat.children.reduce((sum, child) => sum + child._count.products, 0),
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Mega Menu Error:', error);
        res.status(500).json({ error: 'Mega menü verisi alınamadı' });
    }
});

// ═══ POST / — Yeni kategori (ana veya alt) ═══
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, image, parentId, sortOrder } = req.body;
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Kategori adı gerekli' });
        }

        // parentId varsa, parent'ın varlığını kontrol et
        if (parentId) {
            const parent = await prisma.category.findUnique({ where: { id: parseInt(parentId) } });
            if (!parent) return res.status(400).json({ error: 'Üst kategori bulunamadı' });
            // Alt kategorinin altına alt kategori eklemeyi engelle (2 seviye max)
            if (parent.parentId) return res.status(400).json({ error: 'En fazla 2 seviye derinlik destekleniyor' });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                image: image || null,
                parentId: parentId ? parseInt(parentId) : null,
                sortOrder: sortOrder || 0,
            },
        });
        res.status(201).json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bu kategori adı zaten mevcut (aynı üst kategori altında)' });
        }
        console.error('Create Category Error:', error);
        res.status(500).json({ error: 'Kategori oluşturulamadı' });
    }
});

// ═══ PUT /reorder/batch — Sıralama toplu güncelleme ═══
router.put('/reorder/batch', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { items } = req.body; // [{ id: 1, sortOrder: 0 }, ...]
        if (!Array.isArray(items)) return res.status(400).json({ error: 'items array gerekli' });

        await prisma.$transaction(
            items.map(item => prisma.category.update({
                where: { id: item.id },
                data: { sortOrder: item.sortOrder },
            }))
        );
        res.json({ message: 'Sıralama güncellendi' });
    } catch (error) {
        console.error('Reorder Error:', error);
        res.status(500).json({ error: 'Sıralama güncellenemedi' });
    }
});

// ═══ PUT /:id — Kategori güncelle ═══
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, parentId, sortOrder } = req.body;

        const data = {};
        if (name !== undefined) data.name = name.trim();
        if (image !== undefined) data.image = image;
        if (parentId !== undefined) data.parentId = parentId ? parseInt(parentId) : null;
        if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder);

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data,
        });
        res.json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bu kategori adı zaten mevcut' });
        }
        console.error('Update Category Error:', error);
        res.status(500).json({ error: 'Kategori güncellenemedi' });
    }
});

// ═══ DELETE /:id ═══
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const catId = parseInt(id);

        // Alt kategorileri kontrol et
        const children = await prisma.category.count({ where: { parentId: catId } });
        if (children > 0) {
            return res.status(400).json({ error: 'Bu kategorinin alt kategorileri var. Önce onları silin.' });
        }

        await prisma.category.delete({ where: { id: catId } });
        res.json({ message: 'Kategori silindi' });
    } catch (error) {
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Bu kategoriye ait ürünler var, silinemez.' });
        }
        res.status(500).json({ error: 'Kategori silinemedi' });
    }
});

module.exports = router;
