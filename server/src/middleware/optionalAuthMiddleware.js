const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            // If token is invalid, we can either return 403 or treat as guest. 
            // Better to return 403 to avoid confusion if client intended to be logged in.
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        try {
            const user = await prisma.user.findUnique({ where: { id: decoded.userId || decoded.id } }); // Fix: decoded.id handled in authController but middleware was using userId? Checking authController token payload: { id: user.id }
            if (user) {
                req.user = user;
            }
            next();
        } catch (dbError) {
            console.error("Database error during user authentication:", dbError);
            return res.status(500).json({ message: 'Internal server error during authentication' });
        }
    });
};

module.exports = optionalAuth;
