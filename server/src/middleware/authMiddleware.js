const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        try {
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        } catch (dbError) {
            console.error("Database error during user authentication:", dbError);
            return res.status(500).json({ message: 'Internal server error during authentication' });
        }
    });
};

module.exports = authenticateToken;
