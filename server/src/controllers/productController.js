const prisma = require('../lib/prisma');

const getAllProducts = async (req, res) => {
    try {
        const { categoryId, minPrice, maxPrice, search, sort, isFeatured } = req.query;

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const where = {
            isDeleted: false // Default filter for soft deleted products
        };

        if (categoryId) where.categoryId = parseInt(categoryId);

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { name: { contains: search, mode: 'insensitive' } } },
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

        let orderBy = {};
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        else if (sort === 'price_desc') orderBy = { price: 'desc' };
        else if (sort === 'newest') orderBy = { createdAt: 'desc' };
        else orderBy = { id: 'asc' };

        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                include: {
                    category: true,
                    images: true,
                    reviews: { select: { rating: true } }
                },
                orderBy,
                skip,
                take: limit
            })
        ]);

        // Calculate average rating for each product
        const productsWithRating = products.map(product => {
            const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = product.reviews.length > 0 ? (totalRating / product.reviews.length) : 0;

            return {
                ...product,
                rating: parseFloat(averageRating.toFixed(1)),
                reviewCount: product.reviews.length
            };
        });

        res.json({
            products: productsWithRating,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        });
    } catch (error) {
        console.error(error);
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
            include: { category: true, images: true }
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

        const { name, description, price, categoryId, stock, isFeatured } = validation.data;
        const files = req.files || [];

        let mainImage = null;
        if (files.length > 0) {
            mainImage = files[0].filename;
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: price,
                categoryId: categoryId,
                stock: stock,
                isFeatured: isFeatured,
                image: mainImage,
                images: {
                    create: files.map((file, index) => ({
                        url: file.filename,
                        isMain: index === 0
                    }))
                }
            },
            include: { images: true }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error('Create Product Error:', error);
        res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
};

const updateProduct = async (req, res) => {

    try {
        const { id } = req.params;
        console.log('Update Product Request:', { id, body: req.body, files: req.files }); // DEBUG LOG

        const { name, description, price, categoryId, isFeatured } = req.body;
        const files = req.files || [];

        // Create a data object for update
        const data = {
            name,
            description,
            price: price ? parseFloat(price) : undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            stock: req.body.stock ? parseInt(req.body.stock) : undefined,
            isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : undefined
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
    } catch (error) {
        console.error(error);
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
    } catch (error) {
        console.error('Bulk Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete products' });
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkDeleteProducts };
