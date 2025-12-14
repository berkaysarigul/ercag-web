const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken); // Protect all cart routes

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCartItem); // Expects { itemId, quantity }
router.delete('/remove/:itemId', cartController.removeFromCart);
router.post('/sync', cartController.syncCart);

module.exports = router;
