const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./src/utils/logger');
require('./src/queues/whatsappQueue'); // Initialize BullMQ Worker
require('./src/queues/stockQueue'); // Initialize BullMQ Worker

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Config
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cookieParser());
app.use(express.json());

// Setup Morgan to write to Winston
app.use(morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    { stream: { write: message => logger.info(message.trim()) } }
));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// Note: Dynamic imports are used here to avoid issues with ES module static imports breaking app startup.
// Standard imports
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const stockRoutes = require('./src/routes/stockRoutes');
const campaignRoutes = require('./src/routes/campaignRoutes');
const couponRoutes = require('./src/routes/couponRoutes'); // Kept existing
const stockAlertRoutes = require('./src/routes/stockAlertRoutes'); // Kept existing
const heroSlideRoutes = require('./src/routes/heroSlideRoutes'); // Kept existing
const auditRoutes = require('./src/routes/auditRoutes'); // Kept existing
const loyaltyRoutes = require('./src/routes/loyaltyRoutes'); // FIX-K06 // Kept existing

// Important: import the newly created rate limiters!
const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');

// API Rate Limiting protection
app.use('/api/', apiLimiter); // Apply standard API limit to all endpoints
app.use('/api/auth', authLimiter, authRoutes); // Apply stricter Auth limiter to auth routes alone
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes); // Moved reviewRoutes
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes); // Kept existing
app.use('/api/loyalty', loyaltyRoutes); // FIX-K06 // Kept existing
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/hero-slides', heroSlideRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/audit', auditRoutes);
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
    if (['SUPER_ADMIN', 'STAFF', 'ADMIN'].includes(socket.userRole)) {
        socket.join('admin-room');
    }
    if (socket.userId) {
        socket.join(`user-${socket.userId}`);
    }
    socket.on('disconnect', () => { });
});

// Make io accessible globally
app.set('io', io);

// Only start the HTTP server when NOT in test mode.
// This prevents "EADDRINUSE" and "app.address is not a function" errors in Jest,
// because each test file importing this module won't trigger a new server.listen().
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the Express app (not the http.Server) so supertest can wrap it.
module.exports = app;
