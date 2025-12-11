const axios = require('axios');

async function testOrder() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@ercag.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token:', token.substring(0, 20) + '...');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Order
        console.log('Creating order...');
        const orderData = {
            items: [
                { id: 13, quantity: 2 } // Assuming product 13 exists
            ]
        };

        const orderRes = await axios.post('http://localhost:3001/api/orders', orderData, { headers });
        console.log('Order Created:', orderRes.data);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testOrder();
