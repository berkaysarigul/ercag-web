const prisma = require('../lib/prisma');

const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { products: true }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, image } = req.body;
        const category = await prisma.category.create({
            data: { name, image }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image } = req.body;
        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name, image }
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.category.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        if (error.code === 'P2003') { // Foreign key constraint
            return res.status(400).json({ error: 'Bu kategoriye ait ürünler var, silinemez.' });
        }
        res.status(500).json({ error: 'Failed to delete category' });
    }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
