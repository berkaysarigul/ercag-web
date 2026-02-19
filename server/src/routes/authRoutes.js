const express = require('express');
const { register, login, forgotPassword, verifyResetCode, resetPassword, verify2FA } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-2fa', authLimiter, verify2FA); // New
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-code', authLimiter, verifyResetCode);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
