const axios = require('axios');

async function testStockAlert() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@ercag.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Logged in.');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Stock Alert
        const productId = 13; // Assuming product 13 exists
        console.log(`Creating stock alert for product ${productId}...`);
        try {
            await axios.post('http://localhost:3001/api/stock-alerts', { productId }, { headers });
            console.log('Stock alert created.');
        } catch (e) {
            console.log('Create error:', e.response?.data || e.message);
        }

        // 3. Get Alerts
        console.log('Fetching alerts...');
        const alertsRes = await axios.get('http://localhost:3001/api/stock-alerts', { headers });
        console.log('Active Alerts:', alertsRes.data);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testStockAlert();
