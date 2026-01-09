
const fetch = require('node-fetch');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

async function debugB2B() {
    const url = 'https://b2bhint.com/en/search?q=Sasol';
    console.log(`Fetching ${url}...`);

    try {
        const res = await fetch(url, {
            agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CheckItSA/1.0)'
            }
        });

        console.log(`Status: ${res.status}`);
        const html = await res.text();
        console.log(`HTML Length: ${html.length}`);

        if (html.includes('Sasol')) {
            console.log('Found "Sasol" in HTML!');
            // Try to find the link to the company page
            // <a class="company-link" href="/en/company/za/sasol--...">
            const match = html.match(/href="(\/en\/company\/za\/[^"]+)"/);
            if (match) {
                console.log('Found Company Link:', match[1]);
            } else {
                console.log('Could not extract link regex.');
            }
        } else {
            console.log('"Sasol" not found.');
        }
    } catch (e) {
        console.error(e);
    }
}

debugB2B();
