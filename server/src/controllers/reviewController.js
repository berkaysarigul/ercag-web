const prisma = require('../lib/prisma');

const updateProductRating = async (productId) => {
    const aggregations = await prisma.review.aggregate({
        _avg: { rating: true },
        _count: { rating: true },
        where: { productId: parseInt(productId) }
    });

    const rating = aggregations._avg.rating || 0;
    const numReviews = aggregations._count.rating || 0;

    await prisma.product.update({
        where: { id: parseInt(productId) },
        data: { rating, numReviews }
    });
};

const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, rating, comment } = req.body;
        console.log('Create Review Request:', { userId, body: req.body });

        const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId: userId,
                status: 'COMPLETED',
                items: { some: { productId: parseInt(productId) } }
            }
        });

        // Allow if user is admin or has purchased
        if (!hasPurchased && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Bu ürünü değerlendirmek için satın almış olmanız gerekmektedir.' });
        }

        const review = await prisma.review.create({
            data: {
                userId,
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment
            },
            include: { user: { select: { name: true } } }
        });

        await updateProductRating(productId);

        res.status(201).json(review);
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ error: 'Failed to create review', details: error.message });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { productId: parseInt(productId) },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

const getAllReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                user: { select: { name: true, email: true } },
                product: { select: { name: true, id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        console.error('Get All Reviews Error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma.review.delete({
            where: { id: parseInt(id) }
        });

        await updateProductRating(review.productId);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
};

module.exports = { createReview, getProductReviews, getAllReviews, deleteReview };
