
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No API Key found in .env.local');
        return;
    }

    console.log(`Using Key: ${apiKey.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // model-response is not directly exposed easily in v0.1 without getting a model first?
        // Actually the SDK has a way? documentation says genAI.getGenerativeModel...
        // Let's just try to generate content with a "safe" model or just try a direct fetch if SDK doesn't expose listModels easily in the node version.
        // Wait, SDK does not have listModels on the top level class in some versions.

        // Let's use raw fetch to be sure.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log('No models returned. Error:', JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

listModels();
