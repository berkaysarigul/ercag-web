const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProducts = async (req, res) => {
    try {
        const { categoryId, minPrice, maxPrice, search, sort } = req.query;

        const where = {};

        if (categoryId) where.categoryId = parseInt(categoryId);

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } }
            ];
        }

        if (req.query.isFeatured) {
            where.isFeatured = req.query.isFeatured === 'true';
        }

        let orderBy = {};
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        else if (sort === 'price_desc') orderBy = { price: 'desc' };
        else if (sort === 'newest') orderBy = { createdAt: 'desc' };
        else orderBy = { id: 'asc' };

        const products = await prisma.product.findMany({
            where,
            include: { category: true, images: true },
            orderBy
        });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { category: true, images: true }
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        console.error('getProductById Error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, categoryId, isFeatured } = req.body;
        const files = req.files || [];

        let mainImage = null;
        if (files.length > 0) {
            mainImage = files[0].filename;
        }

        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        // Prepare image data
        const date = new Date(); // timestamp needed? No.

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                categoryId: parseInt(categoryId),
                stock: req.body.stock ? parseInt(req.body.stock) : 0,
                isFeatured: isFeatured === 'true' || isFeatured === true,
                image: mainImage, // Backward compatibility
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

        const data = {
            name,
            description,
            price: price ? parseFloat(price) : undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            stock: req.body.stock ? parseInt(req.body.stock) : undefined,
            isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : undefined
        };

        // If new files are uploaded, append them
        // And update main image if none exists or if overwritten?
        // Current logic: If new files, they are added.
        // If product has no main image, first new file becomes main.

        // Note: Managing deletions of specific images is complex in a simple update.
        // We will assume this adds images.

        if (files.length > 0) {
            // Logic to add images (SQLite does not support createMany, use Promise.all)
            await Promise.all(files.map(file =>
                prisma.productImage.create({
                    data: {
                        productId: parseInt(id),
                        url: file.filename,
                        isMain: false
                    }
                })
            ));

            // Also update 'image' column if user wants? 
            // Strategy: We won't touch 'image' column here unless we implement a specific "Set Main" logic.
            // But for ensuring the card shows *something*, if 'image' is null, we should update it.
            const currentProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });
            if (!currentProduct.image) {
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
        try { fs.writeFileSync('error_log.txt', error.stack + '\n\n' + JSON.stringify(error)); } catch (e) { }
        res.status(500).json({ error: 'Failed to update product' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
