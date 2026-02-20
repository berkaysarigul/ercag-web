const prisma = require('../lib/prisma');

const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let where = {};
        if (search) {
            where = {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { phone: { contains: search } }
                ]
            };
        }

        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: { orders: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            })
        ]);

        res.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const { id } = req.params;
        const orders = await prisma.order.findMany({
            where: { userId: parseInt(id) },
            include: {
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Valid roles
        const validRoles = ['SUPER_ADMIN', 'STAFF', 'CUSTOMER'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Update Role Error:', error);
        res.status(500).json({ message: 'Failed to update role' });
    }
};

const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        // Soft delete or anonymize
        await prisma.user.update({
            where: { id: userId },
            data: {
                email: `deleted_${userId}_${Date.now()}@example.com`,
                phone: `deleted_${userId}_${Date.now()}`,
                name: 'Deleted User',
                password: 'DELETED',
                isActive: false // Assuming we have this field or similar logic
            }
        });
        res.json({ message: 'Hesabınız silindi.' });
    } catch (error) {
        console.error('Delete Account Error:', error);
        res.status(500).json({ message: 'Hesap silinemedi.' });
    }
};

const exportMyData = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                orders: { include: { items: true } },
                addresses: true,
                reviews: true
            }
        });

        // Remove sensitive data
        delete user.password;
        delete user.twoFactorCode;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=my-data.json');
        res.json(user);
    } catch (error) {
        console.error('Export Data Error:', error);
        res.status(500).json({ message: 'Veri dışa aktarılamadı.' });
    }
};

module.exports = {
    getAllUsers,
    getUserOrders,
    updateUserRole,
    deleteMyAccount,
    exportMyData
};
