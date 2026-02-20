const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Public routes (if any, e.g., fetching active campaigns for banner)
router.get('/public', async (req, res) => {
    const prisma = require('../lib/prisma');
    try {
        const campaigns = await prisma.campaign.findMany({
            where: { isActive: true, endDate: { gte: new Date() } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch active campaigns' });
    }
});

// Admin routes
router.post('/', authenticateToken, isAdmin, campaignController.createCampaign);
router.get('/', authenticateToken, isAdmin, campaignController.getCampaigns);
router.get('/:id', authenticateToken, isAdmin, campaignController.getCampaignById);
router.put('/:id', authenticateToken, isAdmin, campaignController.updateCampaign);
router.delete('/:id', authenticateToken, isAdmin, campaignController.deleteCampaign);

module.exports = router;
