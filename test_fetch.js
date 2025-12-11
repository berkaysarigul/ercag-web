async function test() {
    try {
        console.log('Fetching from 127.0.0.1...');
        const res1 = await fetch('http://127.0.0.1:3001/api/products/13');
        console.log('127.0.0.1 status:', res1.status);
        if (res1.ok) console.log('127.0.0.1 data:', await res1.json());

        console.log('Fetching from localhost...');
        const res2 = await fetch('http://localhost:3001/api/products/13');
        console.log('localhost status:', res2.status);
    } catch (error) {
        console.error('Error:', error);
    }
}
test();
