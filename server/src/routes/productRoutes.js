const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.get('/categories', require('../controllers/categoryController').getAllCategories);
router.post('/categories', authenticateToken, isAdmin, require('../controllers/categoryController').createCategory);
router.put('/categories/:id', authenticateToken, isAdmin, require('../controllers/categoryController').updateCategory);
router.delete('/categories/:id', authenticateToken, isAdmin, require('../controllers/categoryController').deleteCategory);

// Admin Product Routes
router.post('/products', authenticateToken, isAdmin, upload.array('images', 5), productController.createProduct);
router.put('/products/:id', authenticateToken, isAdmin, upload.array('images', 5), productController.updateProduct);
router.delete('/products/:id', authenticateToken, isAdmin, productController.deleteProduct);
router.post('/products/bulk-delete', authenticateToken, isAdmin, productController.bulkDeleteProducts);

module.exports = router;
