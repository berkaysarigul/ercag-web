const prisma = require('../lib/prisma');

const logAudit = async (userId, action, entityType, entityId, details, ip) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId: entityId ? parseInt(entityId) : null,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
                ipAddress: ip
            }
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
        // Don't throw error to avoid blocking the main action
    }
};

module.exports = { logAudit };
