const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Admin only: Create coupon
router.post('/', authenticateToken, isAdmin, couponController.createCoupon);

// Admin only: Get all coupons
router.get('/', authenticateToken, isAdmin, couponController.getCoupons);

// Public/User: Validate coupon
router.post('/validate', couponController.validateCoupon);

module.exports = router;
