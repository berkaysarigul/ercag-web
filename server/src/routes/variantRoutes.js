const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

const isAdmin = authorizeRole(['SUPER_ADMIN', 'ADMIN']);

// GET /product/:productId — Ürünün varyantları
router.get('/product/:productId', async (req, res) => {
    try {
        const variants = await prisma.productVariant.findMany({
            where: { productId: parseInt(req.params.productId) },
            include: {
                attributes: {
                    include: {
                        attributeValue: {
                            include: { attributeType: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(variants);
    } catch (error) {
        res.status(500).json({ error: 'Varyantlar getirilemedi' });
    }
});

// POST / — Varyant oluştur (tekli veya toplu)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { productId, variants } = req.body;
        // variants: [{ sku, price, stock, attributeValueIds: [1, 3] }, ...]

        if (!productId || !Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ error: 'productId ve variants array gerekli' });
        }

        const created = [];
        for (const v of variants) {
            const variant = await prisma.productVariant.create({
                data: {
                    productId: parseInt(productId),
                    sku: v.sku || null,
                    barcode: v.barcode || null,
                    price: v.price ? parseFloat(v.price) : null,
                    stock: parseInt(v.stock) || 0,
                    image: v.image || null,
                    attributes: {
                        create: (v.attributeValueIds || []).map(avId => ({
                            attributeValueId: parseInt(avId),
                        })),
                    },
                },
                include: {
                    attributes: { include: { attributeValue: { include: { attributeType: true } } } },
                },
            });
            created.push(variant);
        }

        res.status(201).json(created);
    } catch (error) {
        console.error('Create Variant Error:', error);
        if (error.code === 'P2002') return res.status(400).json({ error: 'SKU veya barkod zaten mevcut' });
        res.status(500).json({ error: 'Varyant oluşturulamadı' });
    }
});

// PUT /:id — Varyant güncelle
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { price, stock, sku, barcode, isActive, image } = req.body;
        const variant = await prisma.productVariant.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(price !== undefined && { price: price ? parseFloat(price) : null }),
                ...(stock !== undefined && { stock: parseInt(stock) }),
                ...(sku !== undefined && { sku: sku || null }),
                ...(barcode !== undefined && { barcode: barcode || null }),
                ...(isActive !== undefined && { isActive }),
                ...(image !== undefined && { image }),
            },
        });
        res.json(variant);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'SKU veya barkod zaten mevcut' });
        res.status(500).json({ error: 'Güncellenemedi' });
    }
});

// DELETE /product/:productId — Ürünün tüm varyantlarını sil (önce spesifik route'lar)
router.delete('/product/:productId', authenticateToken, isAdmin, async (req, res) => {
    try {
        await prisma.productVariant.deleteMany({ where: { productId: parseInt(req.params.productId) } });
        res.json({ message: 'Tüm varyantlar silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Silinemedi' });
    }
});

// DELETE /:id — Tek varyant sil
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await prisma.productVariant.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Varyant silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Silinemedi' });
    }
});

module.exports = router;
