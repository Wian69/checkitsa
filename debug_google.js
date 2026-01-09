
const fetch = require('node-fetch');
// Manually load env vars for this script since it's standalone
const apiKey = 'AIzaSyCWX0SE7QsnrImcVPBLNsvOzCccQGlbqrg'; // from prev step view_file
const cx = '16e9212fe3fcf4cea'; // from prev step view_file

async function testGoogle() {
    const query = '"Sasol" South Africa (Company OR "Pty Ltd" OR "CIPC") -site:pinterest.*';
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

    console.log(`Querying Google CSE...`);

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log(`Status: ${res.status}`);
        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
        } else {
            console.log('Results Found:', data.searchInformation?.totalResults);
            if (data.items && data.items.length > 0) {
                console.log('Top Result:', data.items[0].title);
                console.log('Link:', data.items[0].link);
            } else {
                console.log('No items returned.');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

testGoogle();
