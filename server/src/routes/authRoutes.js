const express = require('express');
// FIX-17: Added toggle2FA to imports and route
const { register, login, forgotPassword, verifyResetCode, resetPassword, verify2FA, toggle2FA, me } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.put('/toggle-2fa', authenticateToken, toggle2FA); // FIX-17: New route
router.get('/me', authenticateToken, me);

module.exports = router;
