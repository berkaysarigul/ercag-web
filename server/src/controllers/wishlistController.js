const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        const existingItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId)
                }
            }
        });

        if (existingItem) {
            return res.status(400).json({ message: 'Item already in wishlist' });
        }

        const wishlistItem = await prisma.wishlist.create({
            data: {
                userId,
                productId: parseInt(productId)
            }
        });

        res.status(201).json(wishlistItem);
    } catch (error) {
        console.error('Add to Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId)
                }
            }
        });

        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Remove from Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const wishlist = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: { category: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(wishlist);
    } catch (error) {
        console.error('Get Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

const checkWishlistStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const item = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId)
                }
            }
        });

        res.json({ inWishlist: !!item });
    } catch (error) {
        console.error('Check Wishlist Status Error:', error);
        res.status(500).json({ error: 'Failed to check wishlist status' });
    }
};

module.exports = { addToWishlist, removeFromWishlist, getWishlist, checkWishlistStatus };
