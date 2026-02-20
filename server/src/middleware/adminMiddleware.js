// FIX-18: Removed debug console.log lines
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        // SUPER_ADMIN and ADMIN are always allowed, otherwise check allowedRoles
        if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
            return next();
        }

        res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    };
};

// Backward compatibility (strict admin check)
// Now allows both SUPER_ADMIN and ADMIN
const isAdmin = authorize('SUPER_ADMIN', 'ADMIN');

module.exports = { authorize, isAdmin };
