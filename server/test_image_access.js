const http = require('http');

const filename = 'slide-1765751274429.jpeg'; // From directory listing
const testUrl = `http://localhost:3001/uploads/${filename}`;

console.log(`Testing GET ${testUrl}...`);

http.get(testUrl, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', res.headers['content-length']);

    if (res.statusCode !== 200) {
        console.log('Failed to fetch image.');
        // Consume response to free memory
        res.resume();
        return;
    }

    // Check first few bytes to see if it looks like an image
    let data = [];
    res.on('data', (chunk) => {
        if (data.length < 10) data.push(chunk); // Only collect a bit
    });

    res.on('end', () => {
        console.log('First few bytes received.');
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
