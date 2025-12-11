const express = require('express');
const router = express.Router();
const stockAlertController = require('../controllers/stockAlertController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/', authenticateToken, stockAlertController.createAlert);
router.get('/', authenticateToken, stockAlertController.getAlerts);

module.exports = router;
