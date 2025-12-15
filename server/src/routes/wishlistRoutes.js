const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken); // All wishlist routes require auth

router.post('/', wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);
router.get('/', wishlistController.getWishlist);
router.get('/check/:productId', wishlistController.checkWishlistStatus);

module.exports = router;
