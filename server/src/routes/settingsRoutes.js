const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// All routes are protected and require admin access
router.get('/', authenticateToken, isAdmin, settingsController.getSettings);
router.post('/', authenticateToken, isAdmin, settingsController.updateSettings);

module.exports = router;
