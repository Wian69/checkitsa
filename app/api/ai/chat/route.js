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

RULES:
- ONLY answer questions related to CheckItSA, verification, scams, or security in South Africa.
- If a user asks about general topics (news, sports, other websites, general knowledge), politely decline.
- Say: "I can only help with CheckItSA tools and security verification."
- Do NOT search the web.

OUTPUT FORMAT: Return a JSON object ONLY. No markdown.
{
  "reply": "Your friendly response here.",
  "action": { "label": "Button Text", "url": "/relevant/link" } // or null
}
`;

export async function POST(req) {
    try {
        const { message } = await req.json();

        // Cloudflare Env Access
        const env = getRequestContext()?.env || {};
        // Use GEMINI_API_KEY as established in other routes
        const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                reply: "I'm having trouble connecting to my brain (API Key missing).",
                action: null
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
        let chat;
        let result;
        let errors = [];

        for (const modelName of models) {
            try {
                console.log(`[AI Chat] Attempting model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                chat = model.startChat({
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
                result = await chat.sendMessage(message);
                // If we get here, it worked
                break;
            } catch (e) {
                console.warn(`[AI Chat] Model ${modelName} failed:`, e.message);
                errors.push(`${modelName}: ${e.message}`);
                continue;
            }
        }

        if (!result) {
            throw new Error(`All models failed. Errors: ${errors.join(' | ')}`);
        }

        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        let json = {};

        try {
            json = JSON.parse(text);
        } catch (e) {
            console.error("AI First Pass JSON Error", text);
            // Fallback
            return NextResponse.json({ reply: "I understood, but my internal wiring got crossed. Try asking simpler.", action: null });
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
