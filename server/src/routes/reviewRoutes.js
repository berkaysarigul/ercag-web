const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, reviewController.createReview);
router.get('/:productId', reviewController.getProductReviews);

// Admin Routes
const { authorize } = require('../middleware/adminMiddleware');
router.get('/', authenticateToken, authorize('STAFF', 'ADMIN'), reviewController.getAllReviews);
router.delete('/:id', authenticateToken, authorize('STAFF', 'ADMIN'), reviewController.deleteReview);

module.exports = router;
