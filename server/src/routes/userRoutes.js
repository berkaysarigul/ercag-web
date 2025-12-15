const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Get all users (Admin only)
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);

// Get specific user orders (Admin only)
router.get('/:id/orders', authenticateToken, isAdmin, userController.getUserOrders);

// Update user role (Admin only)
router.put('/:id/role', authenticateToken, isAdmin, userController.updateUserRole);

module.exports = router;
