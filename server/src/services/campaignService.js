const prisma = require('../lib/prisma');

const calculateCartDiscounts = async (cartItems, totalAmount) => {
    // 1. Fetch Active Campaigns
    const now = new Date();
    const campaigns = await prisma.campaign.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now }
        },
        include: {
            targetProduct: true,
            benefitProduct: true
        }
    });

    let discountAmount = 0;
    const appliedCampaigns = [];

    // 2. Iterate and Apply Logic
    for (const campaign of campaigns) {
        if (campaign.minAmount && totalAmount < Number(campaign.minAmount)) continue;

        let campaignApplied = false;
        let benefit = 0;

        switch (campaign.type) {
            case 'PERCENTAGE_OFF':
                if (campaign.targetProductId) {
                    // Product Specific
                    const item = cartItems.find(i => i.productId === campaign.targetProductId);
                    if (item) {
                        benefit = (item.price * item.quantity * Number(campaign.value)) / 100;
                        campaignApplied = true;
                    }
                } else {
                    // General Cart Discount
                    benefit = (totalAmount * Number(campaign.value)) / 100;
                    campaignApplied = true;
                }
                break;

            case 'FIXED_AMOUNT':
                benefit = Number(campaign.value);
                // Ensure benefit doesn't exceed total
                benefit = Math.min(benefit, totalAmount);
                campaignApplied = true;
                break;

            case 'BOGO': // Buy X Get Y Free (or discounted) currently assuming Get 1 Free of same product if not explicit
                // or more complex logic. Let's simplify: Buy 1 Target, Get 1 Benefit Free.
                if (campaign.targetProductId && campaign.benefitProductId) {
                    const targetItem = cartItems.find(i => i.productId === campaign.targetProductId);
                    const benefitItem = cartItems.find(i => i.productId === campaign.benefitProductId);

                    if (targetItem && benefitItem) {
                        // Logic: For every 1 Target, get 1 Benefit Free working on pairs?
                        // Or if Cart has Target, Benefit is free?
                        // Let's assume: Buy X (Target), Get Y (Benefit) Free. 
                        // Simplified: If you buy Target, get Benefit (if in cart) for price off.
                        // Ideally checking quantities.
                        // Let's implement simpler logic: Buy Target, Second Target is %50 off?
                        // "campaign.value" could be discount percentage on benefit product?

                        // Let's implement: Buy 1 Target, Get 1 Benefit (same or different) at %100 off (Free) if value is 100 or null.
                        // Check quantity.
                        const sets = Math.min(targetItem.quantity, benefitItem.quantity);
                        if (sets > 0) {
                            benefit = sets * (Number(benefitItem.price) * (Number(campaign.value || 100) / 100));
                            campaignApplied = true;
                        }
                    }
                }
                break;

            case 'FREE_SHIPPING':
                // Handled usually at shipping calculation stage, but we can return a flag
                if (totalAmount >= Number(campaign.minAmount)) {
                    appliedCampaigns.push({ ...campaign, benefitType: 'shipping' });
                }
                break;
        }

        if (campaignApplied && benefit > 0) {
            discountAmount += benefit;
            appliedCampaigns.push({ ...campaign, discountAmount: benefit });
        }
    }

    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, totalAmount);

    return {
        discountAmount,
        finalAmount: totalAmount - discountAmount,
        appliedCampaigns
    };
};

module.exports = {
    calculateCartDiscounts
};
