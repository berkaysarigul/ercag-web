const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const multer = require('multer');

// CSV/Excel upload için ayrı multer (memoryStorage — dosyayı RAM'de tut)
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream' // Bazı tarayıcılar .xlsx'i böyle gönderir
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece CSV ve Excel dosyaları kabul edilir.'), false);
        }
    }
});

// STATIC routes (must be BEFORE /:id)
router.get('/', productController.getAllProducts);
router.get('/search/suggestions', productController.searchSuggestions);

// Bulk operations (BEFORE /:id to avoid route conflict)
router.get('/bulk-template', authenticateToken, isAdmin, productController.downloadBulkTemplate);
router.post('/bulk-import', authenticateToken, isAdmin, csvUpload.single('file'), productController.bulkImportProducts);
router.post('/bulk-delete', authenticateToken, isAdmin, productController.bulkDeleteProducts);
router.post('/bulk-price-update', authenticateToken, isAdmin, productController.bulkUpdatePrices);
router.get('/export', authenticateToken, isAdmin, productController.exportProducts);

// Dynamic routes
router.get('/:id', productController.getProductById);

// Admin Product CRUD
router.post('/', authenticateToken, isAdmin, upload.array('images', 5), productController.createProduct);
router.put('/:id', authenticateToken, isAdmin, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', authenticateToken, isAdmin, productController.deleteProduct);

module.exports = router;
