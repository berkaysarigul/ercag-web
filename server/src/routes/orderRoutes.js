const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middleware/authMiddleware');
const { authorize, isAdmin } = require('../middleware/adminMiddleware');

router.post('/', authenticateToken, orderController.createOrder);
router.get('/', authenticateToken, orderController.getUserOrders);
router.put('/:id/cancel', authenticateToken, orderController.cancelMyOrder);

// Admin Order Routes (STAFF can manage orders)
router.get('/all', authenticateToken, authorize('STAFF', 'ADMIN'), orderController.getAllOrders);
router.put('/:id/status', authenticateToken, authorize('STAFF', 'ADMIN'), orderController.updateOrderStatus);
router.post('/verify-code', authenticateToken, authorize('STAFF', 'ADMIN'), orderController.verifyPickupCode);

// Admin Stats
router.get('/stats', authenticateToken, isAdmin, require('../controllers/adminController').getDashboardStats);

module.exports = router;
