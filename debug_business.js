
const fetch = require('node-fetch');

async function testBusiness(input) {
    console.log(`\nTesting: "${input}"`);
    try {
        const res = await fetch('http://localhost:3000/api/verify/business', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
        });
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

async function run() {
    await testBusiness('Sasol');
    await testBusiness('Eskom');
    await testBusiness('FakeCompABC123'); // Control
}

run();
