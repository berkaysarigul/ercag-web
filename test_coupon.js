const axios = require('axios');

async function testCoupon() {
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

        // 2. Create Coupon
        const couponCode = 'TEST' + Math.floor(Math.random() * 1000);
        console.log(`Creating coupon ${couponCode}...`);
        try {
            await axios.post('http://localhost:3001/api/coupons', {
                code: couponCode,
                discountType: 'PERCENTAGE',
                discountValue: 10, // 10%
                minOrderAmount: 50,
                expirationDate: '2025-12-31'
            }, { headers });
            console.log('Coupon created.');
        } catch (e) {
            console.log('Create error:', e.response?.data || e.message);
        }

        // 3. Validate Coupon
        console.log('Validating coupon...');
        const validateRes = await axios.post('http://localhost:3001/api/coupons/validate', {
            code: couponCode,
            cartTotal: 100
        });
        console.log('Validation:', validateRes.data);

        // 4. Create Order with Coupon
        console.log('Creating order with coupon...');
        const orderData = {
            items: [{ id: 13, quantity: 2 }], // Total ~91.8
            couponCode: couponCode
        };

        const orderRes = await axios.post('http://localhost:3001/api/orders', orderData, { headers });
        console.log('Order Created:', {
            id: orderRes.data.id,
            total: orderRes.data.totalAmount,
            discount: orderRes.data.discountAmount,
            coupon: orderRes.data.couponCode
        });

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testCoupon();
