
const fetch = require('node-fetch');
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function debugScrape() {
    const url = 'https://www.sacompany.co.za/search-company?company_name=Sasol';
    console.log(`Fetching ${url}...`);

    try {
        const res = await fetch(url, {
            agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log(`Status: ${res.status}`);
        const html = await res.text();
        console.log(`HTML Length: ${html.length}`);

        // Dump the first 2000 chars of the 'content' area if possible, or just look for "Sasol"
        const sasolIndex = html.indexOf('Sasol');
        if (sasolIndex !== -1) {
            console.log('\nSnippet around "Sasol":');
            console.log(html.substring(sasolIndex - 100, sasolIndex + 300));
        } else {
            console.log('"Sasol" not found in HTML.');
            console.log('Start of HTML:', html.substring(0, 500));
        }

    } catch (e) {
        console.error(e);
    }
}

debugScrape();
