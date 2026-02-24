const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const loyaltyController = require('../controllers/loyaltyController');

// FIX-K06: Define loyalty routes
router.get('/status', authenticateToken, loyaltyController.getLoyaltyStatus);
router.post('/redeem', authenticateToken, loyaltyController.redeemPoints);

module.exports = router;
