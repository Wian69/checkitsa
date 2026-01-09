const fetch = require('node-fetch');

async function testScan(url) {
    console.log(`\nTesting: "${url}"`);
    try {
        const res = await fetch('http://localhost:3000/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: url })
        });
        const data = await res.json();
        console.log('Verdict:', data.verdict);
        console.log('Risk Score:', data.riskScore);
        console.log('Domain Age:', data.details.domain_age);
        console.log('Is Shortened:', data.details.is_shortened);
        console.log('---');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

async function run() {
    await testScan('https://bitly.cx/4sBuc'); // User reported scam
    await testScan('http://bit.ly/4q1TJ71'); // User reported scam with redirect
    await testScan('google.com'); // Control - should be safe
}

run();
