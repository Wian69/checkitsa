const whois = require('whois-json');
const fetch = require('node-fetch');

async function testExpansion(url) {
    console.log(`Testing URL: ${url}`);
    let finalUrl = url;
    let domain = new URL(url).hostname;

    try {
        const expandRes = await fetch(url, {
            method: 'HEAD',
            redirect: 'manual'
        });

        const location = expandRes.headers.get('location');
        console.log(`Location header: ${location}`);
        if (location) {
            finalUrl = location.startsWith('http') ? location : `https://${location}`;
            domain = new URL(finalUrl).hostname;
            console.log(`Expanded domain: ${domain}`);
        }
    } catch (e) {
        console.log(`Expansion failed: ${e.message}`);
    }

    try {
        console.log(`Performing WHOIS for: ${domain}`);
        const whoisData = await whois(domain);
        const cDate = whoisData.creationDate || whoisData.created || whoisData['Creation Date'] || whoisData['creation-date'];
        console.log(`Creation Date: ${cDate}`);
        if (cDate) {
            const createdDate = new Date(cDate);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now - createdDate) / (1000 * 60 * 60 * 24));
            const age = diffDays > 365 ? `${(diffDays / 365).toFixed(1)} years` : `${diffDays} days`;
            console.log(`Calculated Age: ${age}`);
        }
    } catch (e) {
        console.log(`WHOIS failed: ${e.message}`);
    }
}

testExpansion('http://bit.ly/4q1TJ71');
