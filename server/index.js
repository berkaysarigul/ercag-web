const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const { apiLimiter } = require('./src/middleware/rateLimitMiddleware');

// Middleware
app.use(cors());
app.use(express.json());
const uploadPath = path.join(__dirname, 'uploads');
console.log('Serving static files from:', uploadPath);
app.use('/uploads', (req, res, next) => {
    console.log('Static file request:', req.url);
    next();
}, express.static(uploadPath));

// Global Rate Limit
app.use('/api', apiLimiter);

// Routes
const authRoutes = require('./src/routes/authRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const couponRoutes = require('./src/routes/couponRoutes');
const stockAlertRoutes = require('./src/routes/stockAlertRoutes');
const userRoutes = require('./src/routes/userRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const heroSlideRoutes = require('./src/routes/heroSlideRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/hero-slides', heroSlideRoutes);

app.get('/', (req, res) => {
    res.send('Erçağ Kırtasiye API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
