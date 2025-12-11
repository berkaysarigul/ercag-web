const axios = require('axios');

async function testWishlist() {
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

        // 2. Add to Wishlist
        console.log('Adding product 13 to wishlist...');
        try {
            await axios.post('http://localhost:3001/api/wishlist', { productId: 13 }, { headers });
            console.log('Added to wishlist.');
        } catch (e) {
            console.log('Add error (might already exist):', e.response?.data || e.message);
        }

        // 3. Check Status
        console.log('Checking status...');
        const checkRes = await axios.get('http://localhost:3001/api/wishlist/check/13', { headers });
        console.log('In Wishlist:', checkRes.data.inWishlist);

        // 4. Get Wishlist
        console.log('Fetching wishlist...');
        const listRes = await axios.get('http://localhost:3001/api/wishlist', { headers });
        console.log('Wishlist items:', listRes.data.map(i => i.product.name));

        // 5. Remove from Wishlist
        console.log('Removing product 13...');
        await axios.delete('http://localhost:3001/api/wishlist/13', { headers });
        console.log('Removed.');

        // 6. Verify Removal
        const checkRes2 = await axios.get('http://localhost:3001/api/wishlist/check/13', { headers });
        console.log('In Wishlist (after remove):', checkRes2.data.inWishlist);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testWishlist();
