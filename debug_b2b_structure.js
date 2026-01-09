
const fetch = require('node-fetch');
const fs = require('fs');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

async function dump() {
    const url = 'https://b2bhint.com/en/search?q=Sasol';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, { agent, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await res.text();
        fs.writeFileSync('b2b_dump.html', html);
        console.log('Saved b2b_dump.html');
    } catch (e) { console.error(e); }
}
dump();
