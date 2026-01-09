
const fetch = require('node-fetch'); // Next.js might mock this or I might need to use built-in fetch if node version is > 18.
// Node 18+ has native fetch.

async function verifyEndpoints() {
    const baseUrl = 'http://localhost:3000';
    const endpoints = [
        '/',
        '/api/report',
        '/verify/business',
        '/verify/scam'
    ];

    console.log(`Verifying endpoints on ${baseUrl}...`);

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`);
            console.log(`[${res.status}] ${endpoint} - ${res.ok ? 'OK' : 'Failed'}`);
        } catch (error) {
            console.error(`[ERROR] ${endpoint}: ${error.message}`);
        }
    }
}

verifyEndpoints();
