const prisma = require('../lib/prisma');

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
                include: { items: { include: { product: true } } }
            });
        }

        // Apply Campaigns (New Logic)
        const { applyActiveCampaigns } = require('./campaignController');

        // Improve items structure for campaign logic if needed
        // applyActiveCampaigns expects items with product: { categoryId }
        // We might need to fetch full product details if not present in cart items or fetch freshly
        const cartItemsWithProduct = await Promise.all(cart.items.map(async (item) => {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            return { ...item, product, price: product.price };
        }));

        const { totalDiscount, appliedCampaigns } = await applyActiveCampaigns(cartItemsWithProduct);

        const totalAmount = cartItemsWithProduct.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const finalAmount = Math.max(0, totalAmount - totalDiscount);

        res.json({
            items: cart.items,
            totalAmount,
            discountAmount: totalDiscount,
            finalAmount,
            appliedCampaigns
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }

        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId
                }
            }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity
                }
            });
        }

        // Return updated cart
        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });

        // Apply Campaigns (New Logic)
        const { applyActiveCampaigns } = require('./campaignController');

        const cartItemsWithProduct = await Promise.all(updatedCart.items.map(async (item) => {
            // updatedCart.items already has product included via findUnique include: { items: { include: { product: true } } }
            // See line 83: include: { items: { include: { product: true } } }
            // So item.product is available
            return { ...item, price: item.product.price };
        }));

        const { totalDiscount, appliedCampaigns } = await applyActiveCampaigns(cartItemsWithProduct);

        const totalAmount = cartItemsWithProduct.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const finalAmount = Math.max(0, totalAmount - totalDiscount);

        res.status(200).json({
            items: updatedCart.items,
            totalAmount,
            discountAmount: totalDiscount,
            finalAmount,
            appliedCampaigns
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, productId, quantity } = req.body;

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        let targetItemId = itemId;

        // If productId provided, find the item ID
        if (productId) {
            const item = await prisma.cartItem.findUnique({
                where: {
                    cartId_productId: {
                        cartId: cart.id,
                        productId: parseInt(productId)
                    }
                }
            });
            if (item) targetItemId = item.id;
        }

        if (!targetItemId) return res.status(404).json({ message: 'Item not found in cart' });

        if (quantity <= 0) {
            await prisma.cartItem.delete({ where: { id: targetItemId } });
        } else {
            await prisma.cartItem.update({
                where: { id: targetItemId },
                data: { quantity }
            });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });
        res.json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params; // itemId here will be treated as productId

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const productId = parseInt(itemId);

        // Verify item exists
        // Actually we can just attempt delete with cartId_productId
        try {
            await prisma.cartItem.delete({
                where: {
                    cartId_productId: {
                        cartId: cart.id,
                        productId: productId
                    }
                }
            });
        } catch (e) {
            // Record not found
            return res.status(404).json({ message: 'Item not found in your cart' });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });
        res.json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const syncCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body; // Array of { productId, quantity } from local storage

        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }

        for (const item of items) {
            const existingItem = await prisma.cartItem.findUnique({
                where: {
                    cartId_productId: {
                        cartId: cart.id,
                        productId: item.id
                    }
                }
            });

            if (existingItem) {
                // Determine strategy: Keep DB or Sum? Let's Sum.
                // Or maybe just ensure at least that quantity?
                // Let's replace if local is newer? Hard to know.
                // Let's Sum for now, or just use local as truth if syncing on login?
                // Usually "Sync" means merging.
                // If I have 2 in DB and 3 in Local, total 5? Or 3?
                // I will assume Sum if different.
                // Actually, simplest is: if user was guest, their local cart matters.
                // If they logged in, they might have DB cart.
                // Let's just UPSERT sort of logic.
                // I'll update DB to match local max, or just add.
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + item.quantity } // Add local quantity to DB quantity
                });
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.id,
                        quantity: item.quantity
                    }
                });
            }
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });

        res.json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    syncCart
};
