const prisma = require('../lib/prisma');

const createCampaign = async (req, res) => {
    try {
        const { name, description, type, value, minAmount, targetProductId, benefitProductId, startDate, endDate, isActive } = req.body;

        const campaign = await prisma.campaign.create({
            data: {
                name, description, type,
                value: value ? parseFloat(value) : undefined,
                minAmount: minAmount ? parseFloat(minAmount) : 0,
                targetProductId: targetProductId ? parseInt(targetProductId) : undefined,
                benefitProductId: benefitProductId ? parseInt(benefitProductId) : undefined,
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
        const campaigns = await prisma.campaign.findMany({
            include: { targetProduct: { select: { name: true } } },
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

        // Parse dates and numbers if present
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);
        if (data.value) data.value = parseFloat(data.value);
        if (data.minAmount) data.minAmount = parseFloat(data.minAmount);
        if (data.targetProductId) data.targetProductId = parseInt(data.targetProductId);
        if (data.benefitProductId) data.benefitProductId = parseInt(data.benefitProductId);

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

module.exports = {
    createCampaign,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign
};
