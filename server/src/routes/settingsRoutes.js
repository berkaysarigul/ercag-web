const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllSettings, getPublicSettings, updateSettings, uploadLogo } = require('../controllers/settingsController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'logo-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Public routes (for frontend to get site title, logo etc)
router.get('/public', getPublicSettings);

// Admin routes
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), getAllSettings);
router.put('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), updateSettings);
router.post('/logo', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), upload.single('logo'), uploadLogo);

module.exports = router;
