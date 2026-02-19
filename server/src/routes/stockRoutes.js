const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads dir exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer — CSV/Excel upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `stock-${Date.now()}${path.extname(file.originalname)}`)
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Sadece CSV ve Excel dosyaları kabul edilir.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/bulk-update', authenticateToken, isAdmin, upload.single('file'), stockController.bulkStockUpdate);
router.get('/template', authenticateToken, isAdmin, stockController.downloadStockTemplate);
router.put('/:productId', authenticateToken, isAdmin, stockController.updateSingleStock);
router.get('/movements', authenticateToken, isAdmin, stockController.getStockMovements);
router.get('/low-stock', authenticateToken, isAdmin, stockController.getLowStockProducts);

module.exports = router;
