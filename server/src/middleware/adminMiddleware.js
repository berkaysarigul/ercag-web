const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        console.log(`[AuthDebug] User Role: ${req.user.role}, Allowed: ${allowedRoles}, Path: ${req.path}`);

        // SUPER_ADMIN and ADMIN are always allowed, otherwise check allowedRoles
        if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
            return next();
        }

        console.log('[AuthDebug] Access Denied');
        res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    };
};

// Backward compatibility (strict admin check)
// Now allows both SUPER_ADMIN and ADMIN
const isAdmin = authorize('SUPER_ADMIN', 'ADMIN');

module.exports = { authorize, isAdmin };
