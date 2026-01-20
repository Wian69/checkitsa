import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are Checkit Bot, the AI security guide for CheckItSA.co.za.
Your goal is to help users find the right verification tool OR answer their security questions directly.
Keep answers very short (under 40 words) and direct.

Site Map:
- "/verify/scam" -> Check if a website URL is safe.
- "/verify/business" -> Verify if a company is registered (CIPC) or legit.
- "/verify/phone" -> Check a phone number for spam/risk.
- "/verify/id" -> Validate a South African ID number.
- "/verify/email" -> Check if an email address is real/deliverable.
- "/report" -> Report a scammer to the community.
- "/subscription" -> Upgrade their plan.

CAPABILITIES:
- If you don't know the answer (e.g. "Is binance down?", "Who owns google?"), you can SEARCH the web.
- To search, return: { "action": { "type": "SEARCH", "query": "keywords" } }
- If you know the answer OR have search results, return: { "reply": "...", "action": { "label": "...", "url": "..." } } (or null action)

OUTPUT FORMAT: Return a JSON object ONLY. No markdown.
`;

export async function POST(req) {
    try {
        const { message } = await req.json();

        // Cloudflare Env Access
        const env = getRequestContext()?.env || {};
        // Use GEMINI_API_KEY as established in other routes
        const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                reply: "I'm having trouble connecting to my brain (API Key missing).",
                action: null
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "{\"reply\": \"Online and ready. How can I protect you today?\", \"action\": null}" }],
                },
            ],
        });

        // 1. First Pass: Ask the model
        let result = await chat.sendMessage(message);
        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        let json = {};

        try {
            json = JSON.parse(text);
        } catch (e) {
            console.error("AI First Pass JSON Error", text);
            // Fallback
            return NextResponse.json({ reply: "I understood, but my internal wiring got crossed. Try asking simpler.", action: null });
        }

        // 2. Check for Search Request
        if (json.action && json.action.type === 'SEARCH') {
            console.log("AI Requested Search:", json.action.query);

            // Perform Search (Serper)
            let searchResults = "No results found.";
            if (serperKey) {
                try {
                    const searchRes = await fetch('https://google.serper.dev/search', {
                        method: 'POST',
                        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ q: json.action.query, gl: 'za' })
                    });
                    const searchData = await searchRes.json();
                    if (searchData.organic) {
                        searchResults = searchData.organic.slice(0, 3).map(r => `- ${r.title}: ${r.snippet}`).join('\n');
                    }
                } catch (err) {
                    console.error("Search Error:", err);
                }
            }

            // 3. Second Pass: Feed results back
            const followUp = `SEARCH RESULTS for "${json.action.query}":\n${searchResults}\n\nNow answer the user's original question: "${message}" based on this. Keep it short.`;
            result = await chat.sendMessage(followUp);
            text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                json = JSON.parse(text);
            } catch (e) {
                // If it fails to return JSON 2nd time, just return text as reply
                return NextResponse.json({ reply: text, action: null });
            }
        }

        return NextResponse.json(json);

    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({
            reply: `System Error: ${error.message || error.toString()}`,
            action: null
        }, { status: 500 });
    }
}
