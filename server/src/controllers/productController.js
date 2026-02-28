const prisma = require('../lib/prisma');
const { logAudit } = require('../services/auditService');
const { redisClient } = require('../config/redis.js');

const getAllProducts = async (req, res) => {
    try {
        const { categoryId, minPrice, maxPrice, search, sort, isFeatured } = req.query;

        // Redis Caching Key based on query params
        const cacheKey = `products_all_${JSON.stringify(req.query)}`;
        if (redisClient) {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`[Cache Hit] Serving ${cacheKey} from Redis`);
                return res.json(JSON.parse(cachedData));
            }
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const where = {
            isDeleted: false // FIX-08: Enable soft delete filter
        };

        if (categoryId) {
            const catId = parseInt(categoryId);
            // Alt kategorilerin ürünlerini de dahil et
            const childCategories = await prisma.category.findMany({
                where: { parentId: catId },
                select: { id: true },
            });
            const categoryIds = [catId, ...childCategories.map(c => c.id)];
            where.categoryId = { in: categoryIds };
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        if (search) {
            // Format for Prisma Full Text Search (split words with OR operator for broader matching)
            const searchQuery = search.trim().split(/\s+/).join(' | ');

            where.OR = [
                { name: { search: searchQuery } },
                { description: { search: searchQuery } },
                { category: { name: { search: searchQuery } } },
                // Only search SKU if length > 3 to avoid noise
                (search.length > 3 ? { sku: { contains: search, mode: 'insensitive' } } : undefined),
                // Exact match for barcode if length > 5
                (search.length > 5 ? { barcode: { equals: search } } : undefined)
            ].filter(Boolean);

            // Log search query (non-blocking)
            prisma.searchLog.create({
                data: { query: search, resultCount: 0 } // We'll update result count later if needed or just log the query
            }).catch(err => console.error('Search Log Error:', err));
        }

        if (isFeatured) {
            where.isFeatured = isFeatured === 'true';
        }

        if (req.query.brandId) {
            where.brandId = parseInt(req.query.brandId);
        }

        let orderBy = {};
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        else if (sort === 'price_desc') orderBy = { price: 'desc' };
        else if (sort === 'newest') orderBy = { createdAt: 'desc' };
        else orderBy = { id: 'asc' };

        // FIX-09: Use denormalized rating/numReviews fields instead of runtime calculation
        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                include: {
                    category: true,
                    images: true,
                    brand: true,
                },
                orderBy,
                skip,
                take: limit
            })
        ]);

        const responsePayload = {
            products,
            pagination: {
                total: total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

        if (redisClient) {
            // Cache for 5 minutes (300 seconds)
            await redisClient.setex(cacheKey, 300, JSON.stringify(responsePayload));
        }

        res.json(responsePayload);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};


const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                id: parseInt(id),
                isDeleted: false
            },
            include: {
                category: true,
                images: true,
                variants: {
                    where: { isActive: true },
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
                },
            }
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        console.error('getProductById Error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

const { createProductSchema } = require('../utils/validationSchemas');

const createProduct = async (req, res) => {
    try {
        const validation = createProductSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: 'Invalid input',
                details: validation.error.flatten().fieldErrors
            });
        }

        const { name, description, price, categoryId, stock, isFeatured, sku, barcode, lowStockThreshold } = validation.data;
        const files = req.files || [];

        // SKU/Barkod benzersizlik kontrolü
        if (sku) {
            const existingSku = await prisma.product.findFirst({ where: { sku, isDeleted: false } });
            if (existingSku) return res.status(400).json({ error: `Bu SKU zaten kullanılıyor: ${sku}` });
        }
        if (barcode) {
            const existingBarcode = await prisma.product.findFirst({ where: { barcode, isDeleted: false } });
            if (existingBarcode) return res.status(400).json({ error: `Bu barkod zaten kullanılıyor: ${barcode}` });
        }

        let mainImage = null;
        if (files.length > 0) {
            mainImage = files[0].filename;
        }

        const product = await prisma.product.create({
            data: {
                name,
                description: description || '',
                price,
                categoryId,
                stock,
                isFeatured,
                sku: sku || null,
                barcode: barcode || null,
                lowStockThreshold: lowStockThreshold || 5,
                image: mainImage,
                images: {
                    create: files.map((file, index) => ({
                        url: file.filename,
                        isMain: index === 0
                    }))
                }
            },
            include: { images: true, category: true }
        });
        res.status(201).json(product);

        logAudit(req.user?.id, 'product.create', 'Product', product.id, { name: product.name, sku: product.sku, price: product.price }, req.ip);
    } catch (error) {
        console.error('Create Product Error:', error);
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            if (target?.includes('sku')) return res.status(400).json({ error: 'Bu SKU zaten kullanılıyor' });
            if (target?.includes('barcode')) return res.status(400).json({ error: 'Bu barkod zaten kullanılıyor' });
        }
        res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
};

const updateProduct = async (req, res) => {

    try {
        const { id } = req.params;
        // Debug log removed

        const { name, description, price, categoryId, isFeatured, sku, barcode, lowStockThreshold } = req.body;
        const files = req.files || [];

        // Create a data object for update
        const data = {
            name,
            description,
            price: price ? parseFloat(price) : undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            stock: req.body.stock ? parseInt(req.body.stock) : undefined,
            isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : undefined,
            sku: sku !== undefined ? (sku || null) : undefined,
            barcode: barcode !== undefined ? (barcode || null) : undefined,
            lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : undefined,
        };

        // Handle Image Deletion
        let deletedIds = [];
        if (req.body.deletedImageIds) {
            try {
                // If sent as FormData string "1,2,3" or JSON "[1,2,3]"
                const raw = req.body.deletedImageIds;
                if (typeof raw === 'string') {
                    if (raw.startsWith('[')) deletedIds = JSON.parse(raw);
                    else deletedIds = raw.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
                } else if (Array.isArray(raw)) {
                    deletedIds = raw.map(id => parseInt(id));
                }
            } catch (e) {
                console.error('Failed to parse deletedImageIds', e);
            }
        }

        if (deletedIds.length > 0) {
            // Get images to delete to check filenames
            const imagesToDelete = await prisma.productImage.findMany({
                where: { id: { in: deletedIds }, productId: parseInt(id) }
            });

            // Delete from DB
            await prisma.productImage.deleteMany({
                where: { id: { in: deletedIds }, productId: parseInt(id) }
            });

            // Check if any deleted image was the main 'image' column
            // We need to fetch current product
            const currentProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });

            // If the main image (product.image) is among the deleted files' URLs
            const isMainDeleted = imagesToDelete.some(img => img.url === currentProduct.image);

            // Or if existingImages was manually cleared from frontend but we don't have separate product.image logic?
            // Let's assume complex sync. simplest: if main deleted, pick another one.
            if (isMainDeleted) {
                // Find remaining images
                const remainingImages = await prisma.productImage.findMany({
                    where: { productId: parseInt(id) },
                    orderBy: { id: 'asc' }
                });

                if (remainingImages.length > 0) {
                    data.image = remainingImages[0].url;
                } else {
                    data.image = null; // No images left
                }
            }
        }

        // Handle New Images
        if (files.length > 0) {
            await Promise.all(files.map(file =>
                prisma.productImage.create({
                    data: {
                        productId: parseInt(id),
                        url: file.filename,
                        isMain: false
                    }
                })
            ));

            // If product has no main image (or we just cleared it above), set first new file as main
            // Re-check current state to be safe, but we can rely on data.image being set if we deleted it.
            // If data.image is undefined, we verify current db state.
            if (data.image === undefined) {
                const currentProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });
                if (!currentProduct.image) data.image = files[0].filename;
            } else if (data.image === null) {
                // We just deleted the main image and found no replacements, so use new file
                data.image = files[0].filename;
            }
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data,
            include: { images: true }
        });
        res.json(product);

        // Audit log
        logAudit(req.user?.id, 'product.update', 'Product', parseInt(id), { name: product.name }, req.ip);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            if (target?.includes('sku')) return res.status(400).json({ error: 'Bu SKU zaten başka üründe kullanılıyor' });
            if (target?.includes('barcode')) return res.status(400).json({ error: 'Bu barkod zaten başka üründe kullanılıyor' });
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.update({
            where: { id: parseInt(id) },
            data: { isDeleted: true }
        });
        res.json({ message: 'Product deleted successfully (soft delete)' });

        // Audit log
        logAudit(req.user?.id, 'product.delete', 'Product', parseInt(id), null, req.ip);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

const bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'IDs array is required' });
        }

        // Optional: Delete images from filesystem too?
        // For now, just DB deletion which cascades if configured, or manually delete images.
        // Prisma cascade delete on Product -> ProductImage handles DB.
        // Filesystem cleanup is harder without tracking. We skip FS cleanup for V1.

        await prisma.product.updateMany({
            where: {
                id: { in: ids.map(id => parseInt(id)) }
            },
            data: { isDeleted: true }
        });

        res.json({ message: `${ids.length} products deleted successfully (soft delete)` });

        // Audit log
        logAudit(req.user?.id, 'product.bulk_delete', 'Product', null, { ids, count: ids.length }, req.ip);
    } catch (error) {
        console.error('Bulk Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete products' });
    }
};

// FIX-02: Fixed searchSuggestions — was using isActive (not in schema) and slug (not in schema)
const searchSuggestions = async (req, res) => {
    try {
        const q = req.query.q || req.query.query;
        if (!q || q.length < 2) {
            return res.json({ products: [], categories: [] });
        }

        const searchQuery = q.trim().split(/\s+/).join(' | ');

        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { search: searchQuery } },
                    { description: { search: searchQuery } }
                ],
                isDeleted: false
            },
            select: { id: true, name: true, price: true, image: true, images: { take: 1, select: { url: true } } },
            take: 6
        });

        const categories = await prisma.category.findMany({
            where: { name: { contains: q, mode: 'insensitive' } },
            select: { id: true, name: true },
            take: 3
        });

        res.json({ products, categories });
    } catch (error) {
        console.error('Search Suggestions Error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
};

const XLSX = require('xlsx');
const { bulkProductRowSchema } = require('../utils/validationSchemas');

/**
 * CSV/Excel şablon indir
 * GET /api/products/bulk-template
 */
const downloadBulkTemplate = async (req, res) => {
    try {
        // Mevcut kategorileri çek
        const categories = await prisma.category.findMany({ select: { name: true }, orderBy: { name: 'asc' } });
        const categoryNames = categories.map(c => c.name).join(', ');

        const templateData = [
            {
                'ID': '',
                'Ürün Adı': 'Faber-Castell 12li Boya Kalemi',
                'Açıklama': 'Yüksek pigmentli, kırılmaya dayanıklı boya kalemleri',
                'Fiyat': '89.90',
                'Kategori': categories[0]?.name || 'Yazı Gereçleri',
                'Mevcut Stok': '100',
                'Stok': '100',
                'SKU': 'FC-BK-012',
                'Barkod': '8690826012345',
                'Düşük Stok Eşiği': '5',
            },
            {
                'ID': '',
                'Ürün Adı': 'Kraf Spiralli Defter A4',
                'Açıklama': '100 yaprak, çizgili, polipropilen kapak',
                'Fiyat': '34.50',
                'Kategori': categories[1]?.name || 'Defterler',
                'Mevcut Stok': '200',
                'Stok': '200',
                'SKU': 'KRF-DEF-A4',
                'Barkod': '8690826054321',
                'Düşük Stok Eşiği': '10',
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);

        // Sütun genişlikleri
        ws['!cols'] = [
            { wch: 8 },  // ID
            { wch: 35 }, // Ürün Adı
            { wch: 50 }, // Açıklama
            { wch: 10 }, // Fiyat
            { wch: 20 }, // Kategori
            { wch: 12 }, // Mevcut Stok
            { wch: 8 },  // Stok
            { wch: 15 }, // SKU
            { wch: 18 }, // Barkod
            { wch: 18 }, // Düşük Stok Eşiği
        ];

        // Bilgi satırı ekle (kategori listesi)
        XLSX.utils.sheet_add_aoa(ws, [
            [],
            ['Mevcut Kategoriler:', categoryNames],
            ['NOT:', 'Kategori adlarını tam olarak yukarıdaki listeden yazınız. Büyük/küçük harf duyarlıdır.', 'ID doluysa güncelleme, boşsa yeni kayıt yapılır.']
        ], { origin: -1 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ercag-urun-sablonu.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Template Download Error:', error);
        res.status(500).json({ error: 'Şablon oluşturulamadı' });
    }
};

/**
 * Toplu ürün yükle (CSV/Excel)
 * POST /api/products/bulk-import
 */
const bulkImportProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawData.length === 0) {
            return res.status(400).json({ error: 'Dosya boş veya okunamadı' });
        }

        // Mevcut kategorileri al (isim → id mapping)
        const categories = await prisma.category.findMany();
        const categoryMap = {};
        categories.forEach(c => { categoryMap[c.name] = c.id; });

        // Mevcut SKU ve barkodları al (çakışma kontrolü)
        const existingSkus = new Set();
        const existingBarcodes = new Set();
        const existingProducts = await prisma.product.findMany({
            where: { isDeleted: false },
            select: { sku: true, barcode: true }
        });
        existingProducts.forEach(p => {
            if (p.sku) existingSkus.add(p.sku);
            if (p.barcode) existingBarcodes.add(p.barcode);
        });

        const results = { created: 0, updated: 0, skipped: 0, errors: [] };
        const batchSkus = new Set(); // Bu dosya içindeki SKU'lar (dosya içi çakışma)
        const batchBarcodes = new Set();

        // Header mapping (Türkçe → İngilizce)
        const headerMap = {
            'ID': 'id', 'id': 'id',
            'Ürün Adı': 'name', 'Urun Adi': 'name', 'name': 'name',
            'Açıklama': 'description', 'Aciklama': 'description', 'description': 'description',
            'Fiyat': 'price', 'price': 'price',
            'Kategori': 'categoryName', 'category': 'categoryName', 'categoryName': 'categoryName',
            'Stok': 'stock', 'stock': 'stock', 'Mevcut Stok': 'stock',
            'SKU': 'sku', 'sku': 'sku',
            'Barkod': 'barcode', 'barcode': 'barcode',
            'Düşük Stok Eşiği': 'lowStockThreshold', 'Dusuk Stok Esigi': 'lowStockThreshold', 'lowStockThreshold': 'lowStockThreshold',
        };

        for (let i = 0; i < rawData.length; i++) {
            const rawRow = rawData[i];
            const rowNum = i + 2; // Excel satır numarası (header + 1-indexed)

            // Header map uygula
            const row = {};
            for (const [key, value] of Object.entries(rawRow)) {
                const mappedKey = headerMap[key] || headerMap[key.trim()] || key;
                row[mappedKey] = typeof value === 'string' ? value.trim() : value;
            }

            // Boş satırları atla (bilgi satırları vs.)
            if (!row.name || String(row.name).startsWith('Mevcut Kategori') || String(row.name).startsWith('NOT:')) {
                continue;
            }

            // Zod validasyonu (Kategori ID'sini daha esnek yönetebilir)
            const validation = bulkProductRowSchema.safeParse(row);
            if (!validation.success) {
                const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
                    .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                    .join('; ');
                results.errors.push({ row: rowNum, name: row.name || '?', error: errorMessages });
                results.skipped++;
                continue;
            }

            const data = validation.data;

            // Kategori kontrolü
            const categoryId = categoryMap[data.categoryName];
            if (!categoryId) {
                results.errors.push({ row: rowNum, name: data.name, error: `Kategori bulunamadı: "${data.categoryName}"` });
                results.skipped++;
                continue;
            }

            // SKU çakışma kontrolü (yeni ürünse veya dosya içi çakışmaysa)
            if (data.sku && !row.id) {
                if (existingSkus.has(data.sku) || batchSkus.has(data.sku)) {
                    results.errors.push({ row: rowNum, name: data.name, error: `SKU zaten mevcut: ${data.sku}` });
                    results.skipped++;
                    continue;
                }
                batchSkus.add(data.sku);
            }

            // Barkod çakışma kontrolü (yeni ürünse)
            if (data.barcode && !row.id) {
                if (existingBarcodes.has(data.barcode) || batchBarcodes.has(data.barcode)) {
                    results.errors.push({ row: rowNum, name: data.name, error: `Barkod zaten mevcut: ${data.barcode}` });
                    results.skipped++;
                    continue;
                }
                batchBarcodes.add(data.barcode);
            }

            // Ürünü oluştur veya Güncelle (Upsert)
            try {
                if (row.id) {
                    await prisma.product.update({
                        where: { id: parseInt(row.id) },
                        data: {
                            name: data.name,
                            description: data.description || '',
                            price: data.price,
                            categoryId: categoryId || undefined,
                            stock: data.stock,
                            sku: data.sku || null,
                            barcode: data.barcode || null,
                            lowStockThreshold: data.lowStockThreshold || 5,
                        }
                    });
                    results.updated++;
                } else {
                    await prisma.product.create({
                        data: {
                            name: data.name,
                            description: data.description || '',
                            price: data.price,
                            categoryId,
                            stock: data.stock,
                            sku: data.sku || null,
                            barcode: data.barcode || null,
                            lowStockThreshold: data.lowStockThreshold || 5,
                        }
                    });
                    results.created++;
                }
            } catch (dbError) {
                if (dbError.code === 'P2025') {
                    results.errors.push({ row: rowNum, name: data.name, error: `Belirtilen ID (${row.id}) bulunamadı` });
                } else {
                    results.errors.push({ row: rowNum, name: data.name, error: dbError.message });
                }
                results.skipped++;
            }
        }

        // Redis cache temizle
        const { invalidateCache } = require('../config/redis.js');
        await invalidateCache('products_all_*');

        // Audit log
        logAudit(req.user?.id, 'product.bulk_import', 'Product', null, {
            created: results.created, updated: results.updated, skipped: results.skipped, errorCount: results.errors.length
        }, req.ip);

        res.json({
            message: `${results.updated + results.created} ürün başarıyla işlendi (Eklendi: ${results.created}, Güncellendi: ${results.updated}). ${results.skipped} satır atlandı.`,
            ...results
        });
    } catch (error) {
        console.error('Bulk Import Error:', error);
        res.status(500).json({ error: 'İçe aktarma başarısız', details: error.message });
    }
};

/**
 * Ürün listesini Excel olarak dışa aktar
 * GET /api/products/export
 */
const exportProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isDeleted: false },
            include: { category: true },
            orderBy: { id: 'asc' }
        });

        const exportData = products.map(p => ({
            'ID': p.id,
            'Ürün Adı': p.name,
            'Açıklama': p.description,
            'Fiyat': Number(p.price),
            'Kategori': p.category?.name || '',
            'Stok': p.stock,
            'SKU': p.sku || '',
            'Barkod': p.barcode || '',
            'Düşük Stok Eşiği': p.lowStockThreshold,
            'Öne Çıkan': p.isFeatured ? 'Evet' : 'Hayır',
            'Oluşturulma': p.createdAt.toISOString().split('T')[0],
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = [
            { wch: 6 }, { wch: 35 }, { wch: 50 }, { wch: 10 }, { wch: 20 },
            { wch: 8 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 12 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=ercag-urunler-${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Dışa aktarma başarısız' });
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, searchSuggestions, downloadBulkTemplate, bulkImportProducts, exportProducts };

