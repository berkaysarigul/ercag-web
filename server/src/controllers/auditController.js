const prisma = require('../lib/prisma');

const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const entityType = req.query.entityType;
        const action = req.query.action;
        const userId = req.query.userId ? parseInt(req.query.userId) : undefined;

        const where = {};
        if (entityType && entityType !== 'ALL') where.entityType = entityType;
        if (action) where.action = { contains: action }; // Basic search
        if (userId) where.userId = userId;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                // Include minimal user info just in case we want to show name directly
                // But schema doesn't have relation defined in AuditLog to User? 
                // Schema definition: userId Int. No relation defined.
                // So we can't include user details directly via Prisma unless we add relation.
                // For now, we will just return userId. Frontend can fetch user map if needed or we fix schema.
                // Let's assume for now we just show ID or we need to add relation.
                // Adding relation now is better.
            }),
            prisma.auditLog.count({ where })
        ]);

        // Fetch user names for the logs manually if relation is missing
        const userIds = [...new Set(logs.map(l => l.userId))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        });

        const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

        const enrichedLogs = logs.map(log => ({
            ...log,
            user: userMap[log.userId] || { name: 'Bilinmeyen', email: '-' }
        }));

        res.json({ logs: enrichedLogs, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Audit Log Fetch Error:', error);
        res.status(500).json({ error: 'Loglar alınamadı' });
    }
};

module.exports = { getAuditLogs };
