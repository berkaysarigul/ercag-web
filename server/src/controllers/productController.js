const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProducts = async (req, res) => {
    try {
        console.log('GET /products query:', req.query);
        const { categoryId, minPrice, maxPrice, search, sort } = req.query;

        const where = {};

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

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

        let orderBy = {};
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        else if (sort === 'price_desc') orderBy = { price: 'desc' };
        else if (sort === 'newest') orderBy = { createdAt: 'desc' };
        else orderBy = { id: 'asc' };

        const products = await prisma.product.findMany({
            where,
            include: { category: true },
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
            include: { category: true }
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
        console.log('POST /products body:', req.body);
        console.log('POST /products file:', req.file);
        const { name, description, price, categoryId } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                categoryId: parseInt(categoryId),
                stock: req.body.stock ? parseInt(req.body.stock) : 0,
                image
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error('Create Product Error:', error);
        require('fs').writeFileSync('server_error.log', String(error) + '\n' + JSON.stringify(error, null, 2));
        res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, categoryId } = req.body;
        const image = req.file ? req.file.filename : undefined;

        const data = {
            name,
            description,
            price: price ? parseFloat(price) : undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            stock: req.body.stock ? parseInt(req.body.stock) : undefined
        };

        if (image) {
            data.image = image;
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data
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
