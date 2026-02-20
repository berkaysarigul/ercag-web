const prisma = require('../lib/prisma');

// Helper to validate campaign config based on type
const validateConfig = (type, config) => {
    try {
        const parsed = typeof config === 'string' ? JSON.parse(config) : config;
        switch (type) {
            case 'BUY_X_GET_Y':
                if (!parsed.buyQuantity || !parsed.payQuantity) return false;
                break;
            case 'CATEGORY_DISCOUNT':
                if (!parsed.categoryId || !parsed.discountPercent) return false;
                break;
            case 'FLASH_SALE':
                if (!parsed.productIds || !parsed.discountPercent) return false;
                break;
            default:
                return true; // LOYALTY or others might not need strict config
        }
        return true;
    } catch (e) {
        return false;
    }
};

const createCampaign = async (req, res) => {
    try {
        const { name, type, config, startDate, endDate, isActive } = req.body;

        if (!validateConfig(type, config)) {
            return res.status(400).json({ error: 'Invalid campaign configuration for selected type' });
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                type,
                config: typeof config === 'object' ? JSON.stringify(config) : config,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive !== undefined ? isActive : true
            }
        });
        res.status(201).json(campaign);
    } catch (error) {
        console.error('Create Campaign Error:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
};

const getCampaigns = async (req, res) => {
    try {
        const { status } = req.query; // 'active', 'all'
        let where = {};

        if (status === 'active') {
            const now = new Date();
            where = {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            };
        }

        const campaigns = await prisma.campaign.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(campaigns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
};

const getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await prisma.campaign.findUnique({ where: { id: parseInt(id) } });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
};

const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);
        if (data.config && typeof data.config === 'object') data.config = JSON.stringify(data.config);

        const campaign = await prisma.campaign.update({
            where: { id: parseInt(id) },
            data
        });
        res.json(campaign);
    } catch (error) {
        console.error('Update Campaign Error:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
};

const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.campaign.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Campaign deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
};

// Application Logic (Internal Service Function)
const applyActiveCampaigns = async (items) => {
    const now = new Date();
    const campaigns = await prisma.campaign.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now }
        }
    });

    let totalDiscount = 0;
    const appliedCampaigns = [];

    // Clone items to avoid mutating original array if passed by ref
    // We need to track processed items for exclusive campaigns if needed

    // For simplicity, let's assume multiple campaigns can apply but we should prioritize or sort them?
    // Or just apply sequentially.

    // Logic: Iterate campaigns, check applicability to items
    for (const campaign of campaigns) {
        const config = JSON.parse(campaign.config);

        if (campaign.type === 'CATEGORY_DISCOUNT') {
            const { categoryId, discountPercent } = config;
            for (const item of items) {
                // Determine category of item (This requires items to have categoryId or product populated)
                // Assuming items have product: { categoryId } populated
                if (item.product?.categoryId === parseInt(categoryId)) {
                    const discount = (Number(item.price) * item.quantity * Number(discountPercent)) / 100;
                    totalDiscount += discount;
                    appliedCampaigns.push({ id: campaign.id, name: campaign.name, discount });
                }
            }
        } else if (campaign.type === 'FLASH_SALE') {
            const { productIds, discountPercent } = config;
            // productIds might be array of IDs or comma separated string? standard: array
            const targetIds = Array.isArray(productIds)
                ? productIds.map(Number)
                : (productIds ? String(productIds).split(',').map(Number) : []);

            for (const item of items) {
                if (targetIds.includes(item.productId)) {
                    const discount = (Number(item.price) * item.quantity * Number(discountPercent)) / 100;
                    totalDiscount += discount;
                    appliedCampaigns.push({ id: campaign.id, name: campaign.name, discount });
                }
            }
        } else if (campaign.type === 'BUY_X_GET_Y') {
            const { buyQuantity, payQuantity, categoryId, productId } = config;
            // Complex logic: Group items by eligibility
            // If categoryId set, only items in category. If productId set, only specific product.
            // If neither, assuming store-wide? Or maybe error.

            let eligibleItems = [];
            if (productId) {
                eligibleItems = items.filter(i => i.productId === parseInt(productId));
            } else if (categoryId) {
                eligibleItems = items.filter(i => i.product?.categoryId === parseInt(categoryId));
            }

            // Calculate total quantity of eligible items
            const totalQty = eligibleItems.reduce((sum, i) => sum + i.quantity, 0);
            if (totalQty >= parseInt(buyQuantity)) {
                const freeSets = Math.floor(totalQty / parseInt(buyQuantity));
                const freeQty = freeSets * (parseInt(buyQuantity) - parseInt(payQuantity));

                // Apply discount to cheapest items or average? 
                // Standard BOGO: Cheapest item free.
                // Here, if it's mixed products, it gets complicated. 
                // Simplified: Average unit price of eligible items * freeQty
                if (freeQty > 0 && eligibleItems.length > 0) {
                    // Check average price or sort items by price
                    // Let's take the lowest price among eligible items to be safe/standard
                    // Expand items to individual units to find cheapest? Expensive.
                    // Fallback: Weighted average price
                    const totalEligiblePrice = eligibleItems.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0);
                    const avgPrice = totalEligiblePrice / totalQty;

                    const discount = avgPrice * freeQty;
                    totalDiscount += discount;
                    appliedCampaigns.push({ id: campaign.id, name: campaign.name, discount });
                }
            }
        }
    }

    return { totalDiscount, appliedCampaigns };
};

module.exports = {
    createCampaign,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    applyActiveCampaigns
};
