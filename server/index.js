const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const { apiLimiter } = require('./src/middleware/rateLimitMiddleware');

// Middleware
const corsOptions = {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow serving static files
}));
app.use(express.json());

const uploadPath = path.join(__dirname, 'uploads');
console.log('Serving static files from:', uploadPath);
app.use('/uploads', (req, res, next) => {
    // console.log('Static file request:', req.url); // Reduce log noise
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
const categoryRoutes = require('./src/routes/categoryRoutes'); // Added
const stockRoutes = require('./src/routes/stockRoutes'); // Added
const auditRoutes = require('./src/routes/auditRoutes'); // Added

app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes); // Changed from '/api' to '/api/products'
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
// Duplicate stockAlertRoutes removed from line 47
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/hero-slides', heroSlideRoutes);
app.use('/api/categories', categoryRoutes); // Added
app.use('/api/stock', stockRoutes);
app.use('/api/audit', auditRoutes);
const campaignRoutes = require('./src/routes/campaignRoutes');
app.use('/api/campaigns', campaignRoutes);

app.get('/', (req, res) => {
    res.send('Erçağ Kırtasiye API is running');
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Sunucu hatası' });
});

// Socket.io Setup
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Socket authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next();
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
    } catch (err) { }
    next();
});

io.on('connection', (socket) => {
    // console.log('Socket connected:', socket.id); // Reduce log noise

    // Admin room
    if (['SUPER_ADMIN', 'STAFF', 'ADMIN'].includes(socket.userRole)) {
        socket.join('admin-room');
    }

    // User-specific room
    if (socket.userId) {
        socket.join(`user-${socket.userId}`);
    }

    socket.on('disconnect', () => {
        // console.log('Socket disconnected:', socket.id);
    });
});

// Make io accessible globally
app.set('io', io);

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
