const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController'); // Added
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Get all users (Admin only)
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);

// Get specific user orders (Admin only)
router.get('/:id/orders', authenticateToken, isAdmin, userController.getUserOrders);

// Update user role (Admin only)
router.put('/:id/role', authenticateToken, isAdmin, userController.updateUserRole);

router.delete('/me', authenticateToken, userController.deleteMyAccount); // New
router.get('/me/data-export', authenticateToken, userController.exportMyData); // New
router.post('/toggle-2fa', authenticateToken, authController.toggle2FA); // New

module.exports = router;
