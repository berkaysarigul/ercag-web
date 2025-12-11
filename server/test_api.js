const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://127.0.0.1:3001/api';

async function test() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ercag.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token:', token ? 'Received' : 'Missing');

        // 2. Create Product
        console.log('Creating product...');
        const form = new FormData();
        form.append('name', 'API Test Product');
        form.append('description', 'Created via API script');
        form.append('price', '99.99');
        form.append('categoryId', '1'); // Assuming category 1 exists (Defterler)

        // Create a dummy file for upload
        fs.writeFileSync('test_image.jpg', 'dummy image content');
        form.append('image', fs.createReadStream('test_image.jpg'), 'test_image.jpg');

        const productRes = await axios.post(`${API_URL}/products`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Product created:', productRes.data);

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

test();
