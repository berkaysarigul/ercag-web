const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;

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

        const users = await prisma.user.findMany({
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
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
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

module.exports = {
    getAllUsers,
    getUserOrders,
    updateUserRole
};
