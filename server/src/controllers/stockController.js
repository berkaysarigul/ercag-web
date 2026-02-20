const prisma = require('../lib/prisma');
const { recordStockMovement } = require('../services/stockService');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// CSV/Excel ile toplu stok güncelleme
const bulkStockUpdate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi. CSV veya Excel dosyası gerekli.' });
        }

        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        // Dosyayı temizle
        fs.unlinkSync(filePath);

        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: 'Dosya boş veya okunamadı.' });
        }

        const results = {
            success: [],
            errors: [],
            total: rows.length
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Excel satır numarası (header=1)

            try {
                // Ürünü bul — SKU, barkod, ID veya isimle
                let product = null;
                const identifier = row['SKU'] || row['sku'] || row['Barkod'] || row['barkod'] || row['barcode'];
                const productId = row['ID'] || row['id'] || row['Ürün ID'] || row['urun_id'];
                const productName = row['Ürün Adı'] || row['urun_adi'] || row['name'] || row['Ürün'];
                const newStockValue = parseInt(row['Stok'] || row['stok'] || row['stock'] || row['Adet'] || row['adet']);
                const priceValue = row['Fiyat'] || row['fiyat'] || row['price'];

                if (isNaN(newStockValue)) {
                    results.errors.push({ row: rowNum, message: `Geçersiz stok değeri`, data: row });
                    continue;
                }

                // Ürünü bul: önce ID, sonra SKU/barkod, sonra isim
                if (productId) {
                    product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
                }
                if (!product && identifier) {
                    product = await prisma.product.findFirst({
                        where: { OR: [{ sku: identifier }, { barcode: String(identifier) }] }
                    });
                }
                if (!product && productName) {
                    // İsim ile ararken dikkatli ol, tam eşleşme
                    product = await prisma.product.findFirst({
                        where: { name: { equals: productName, mode: 'insensitive' } }
                    });
                }

                if (!product) {
                    results.errors.push({ row: rowNum, message: `Ürün bulunamadı`, data: row });
                    continue;
                }

                // Stok modu: "set" (doğrudan ayarla) veya "add" (mevcut üzerine ekle)
                const mode = (row['Mod'] || row['mod'] || row['mode'] || 'set').toLowerCase();
                let quantityChange;

                if (mode === 'add' || mode === 'ekle') {
                    quantityChange = newStockValue;
                } else {
                    // "set" modu — farkı hesapla
                    quantityChange = newStockValue - product.stock;
                }

                if (quantityChange !== 0) {
                    await recordStockMovement(
                        product.id,
                        quantityChange > 0 ? 'IN' : 'ADJUSTMENT',
                        quantityChange,
                        `Toplu stok güncelleme (Satır ${rowNum})`,
                        req.user.id
                    );
                }

                // Fiyat güncelleme (opsiyonel)
                if (priceValue && !isNaN(parseFloat(priceValue))) {
                    await prisma.product.update({
                        where: { id: product.id },
                        data: { price: parseFloat(priceValue) }
                    });
                }

                results.success.push({
                    row: rowNum,
                    productId: product.id,
                    productName: product.name,
                    previousStock: product.stock,
                    newStock: product.stock + quantityChange,
                    change: quantityChange
                });

            } catch (err) {
                results.errors.push({ row: rowNum, message: err.message, data: row });
            }
        }

        res.json({
            message: `${results.success.length}/${results.total} ürün başarıyla güncellendi.`,
            ...results
        });

    } catch (error) {
        console.error('Bulk Stock Update Error:', error);
        res.status(500).json({ error: 'Toplu güncelleme başarısız', details: error.message });
    }
};

// Stok şablonu indirme (CSV)
const downloadStockTemplate = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, name: true, sku: true, barcode: true, stock: true, price: true },
            orderBy: { name: 'asc' }
        });

        const data = products.map(p => ({
            'ID': p.id,
            'Ürün Adı': p.name,
            'SKU': p.sku || '',
            'Barkod': p.barcode || '',
            'Mevcut Stok': p.stock,
            'Stok': p.stock, // Admin bunu düzenleyecek
            'Fiyat': Number(p.price),
            'Mod': 'set' // "set" veya "ekle"
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Sütun genişlikleri
        worksheet['!cols'] = [
            { wch: 6 },  // ID
            { wch: 40 }, // Ürün Adı
            { wch: 15 }, // SKU
            { wch: 15 }, // Barkod
            { wch: 12 }, // Mevcut Stok
            { wch: 8 },  // Stok
            { wch: 10 }, // Fiyat
            { wch: 8 }   // Mod
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=stok-sablonu-${Date.now()}.xlsx`);
        res.send(buffer);

    } catch (error) {
        console.error('Template Download Error:', error);
        res.status(500).json({ error: 'Şablon oluşturulamadı' });
    }
};

// Tek ürün stok güncelleme (manuel)
const updateSingleStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, type, reason } = req.body;

        if (!quantity || !type) {
            return res.status(400).json({ error: 'Miktar ve tip gerekli' });
        }

        // OUT işleminde miktar negatif olmalı (stockService logic'ine göre artış/azalış quantity ile belirleniyor ancak stockService newStock = prev + quantity yapıyor)
        // stockService'de: newStock = previousStock + quantity.
        // Yani OUT için quantity negatif girmeliyiz.

        // Check type: IN, OUT, ADJUSTMENT, ORDER
        // Eğer OUT ise, quantity'yi negatif yap.
        // Eğer IN ise pozitif. 
        // Eğer ADJUSTMENT ise, kullanıcı + veya - girebilir (örneğin sayım farkı). 
        // Ancak genellikle arayüzde "Ekle" veya "Çıkar" butonları olur. 
        // Basitlik için: IN ise pozitif, OUT ise negatif alalım.

        let actualQuantity = parseInt(quantity);
        if (type === 'OUT') {
            actualQuantity = -Math.abs(actualQuantity);
        } else if (type === 'IN') {
            actualQuantity = Math.abs(actualQuantity);
        }
        // ADJUSTMENT'da quantity ne gelirse o (negatifse düşer, pozitifse artar)

        const result = await recordStockMovement(
            parseInt(productId),
            type,
            actualQuantity,
            reason || 'Manuel güncelleme',
            req.user.id
        );

        res.json({ message: 'Stok güncellendi', ...result });
    } catch (error) {
        console.error('Single Stock Update Error:', error);
        res.status(500).json({ error: 'Stok güncellenemedi' });
    }
};

// Stok hareketleri geçmişi
const getStockMovements = async (req, res) => {
    try {
        const { productId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        const where = productId ? { productId: parseInt(productId) } : {};

        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                include: {
                    product: { select: { name: true, sku: true } },
                    // createdBy user info
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.stockMovement.count({ where })
        ]);

        res.json({ movements, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Get Stock Movements Error:', error);
        res.status(500).json({ error: 'Stok hareketleri alınamadı' });
    }
};

// FIX-16: Replaced invalid prisma field comparison with raw SQL
const getLowStockProducts = async (req, res) => {
    try {
        const products = await prisma.$queryRaw`
            SELECT id, name, sku, stock, "lowStockThreshold"
            FROM "Product"
            WHERE stock <= "lowStockThreshold" AND "isDeleted" = false
            ORDER BY stock ASC
        `;
        res.json(products);
    } catch (error) {
        console.error('Low Stock Error:', error);
        res.status(500).json({ error: 'Düşük stok listesi alınamadı' });
    }
};

module.exports = {
    bulkStockUpdate,
    downloadStockTemplate,
    updateSingleStock,
    getStockMovements,
    getLowStockProducts
};
