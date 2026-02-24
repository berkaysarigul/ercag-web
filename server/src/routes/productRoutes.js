const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

// FIX-03: Static routes BEFORE dynamic :id routes
router.get('/', productController.getAllProducts);
router.get('/search/suggestions', productController.searchSuggestions); // Must be before /:id

// Dynamic routes
router.get('/:id', productController.getProductById);

// Admin Product Routes
router.post('/', authenticateToken, isAdmin, upload.array('images', 5), productController.createProduct);
router.put('/:id', authenticateToken, isAdmin, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', authenticateToken, isAdmin, productController.deleteProduct);
router.post('/bulk-delete', authenticateToken, isAdmin, productController.bulkDeleteProducts);

// FIX-11: Category routes REMOVED from here — they live in categoryRoutes.js

module.exports = router;
