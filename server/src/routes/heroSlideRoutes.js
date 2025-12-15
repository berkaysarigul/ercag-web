const express = require('express');
const router = express.Router();
const { getAllSlides, getActiveSlides, createSlide, updateSlide, deleteSlide } = require('../controllers/heroSlideController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'slide-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Public routes
router.get('/active', getActiveSlides);

// Admin routes
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), getAllSlides);
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), upload.single('image'), createSlide);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), upload.single('image'), updateSlide);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), deleteSlide);

module.exports = router;
