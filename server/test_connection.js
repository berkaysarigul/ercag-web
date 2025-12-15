const http = require('http');

const testUrl = 'http://localhost:3001/api/settings/public';

console.log(`Testing GET ${testUrl}...`);

http.get(testUrl, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body:', data);
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
