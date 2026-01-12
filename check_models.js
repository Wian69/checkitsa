const { GoogleGenerativeAI } = require("@google/generative-ai");

// Hardcode key for this one-off test since we can't access Edge env vars here consistently
// We'll ask user to run this or we'll inject their key if we knew it, but for now
// we will just write a script that attempts to list models.
// NOTE: Since I don't have the user's key, I'll write this script to be run with the key as an arg
// or I will try to use the 'check_models.js' approach.

async function checkModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log("Please set GEMINI_API_KEY env var");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);

    // Try to list models
    try {
        // We define a helper to fetch models since the SDK method might also need version tweaking
        // actually the SDK usually handles this.
        // Let's try v1 first
        console.log("Checking models...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // There isn't a direct "list models" in the high-level helper shown in docs sometimes,
        // but let's try a direct fetch to the API endpoint using fetch if SDK fails.

        // Actually, let's just use a simple fetch to the list endpoint.
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(listUrl);
        const data = await res.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.error("List failed:", data);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkModels();
