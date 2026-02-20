const express = require('express');
// FIX-17: Added toggle2FA to imports and route
const { register, login, forgotPassword, verifyResetCode, resetPassword, verify2FA, toggle2FA } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-2fa', authLimiter, verify2FA);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-code', authLimiter, verifyResetCode);
router.post('/reset-password', authLimiter, resetPassword);
router.put('/toggle-2fa', authenticateToken, toggle2FA); // FIX-17: New route

module.exports = router;
