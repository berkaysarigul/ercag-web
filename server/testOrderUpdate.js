const axios = require('axios');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Get Admin User
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!admin) {
            console.error('No admin found');
            return;
        }

        // 2. Generate Token
        const token = jwt.sign({ userId: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated Token:', token);

        // 3. Get an Order
        const order = await prisma.order.findFirst();
        if (!order) {
            console.error('No order found');
            return;
        }
        console.log('Testing with Order ID:', order.id, 'Current Status:', order.status);

        // 4. Send PUT Request
        const newStatus = 'PREPARING';
        console.log(`Sending PUT request to update status to ${newStatus}...`);

        try {
            const res = await axios.put(`http://localhost:3001/api/orders/${order.id}/status`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Response Status:', res.status);
            console.log('Response Data:', res.data);
        } catch (err) {
            console.error('Request Failed:', err.response ? err.response.data : err.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
