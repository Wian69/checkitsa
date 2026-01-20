import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are Checkit Bot, the AI security guide for CheckItSA.co.za.
Your goal is to help users find the right verification tool for their problem.
Keep answers very short (under 20 words) and direct.

Site Map:
- "/verify/scam" -> Check if a website URL is safe.
- "/verify/business" -> Verify if a company is registered (CIPC) or legit.
- "/verify/phone" -> Check a phone number for spam/risk.
- "/verify/id" -> Validate a South African ID number.
- "/verify/email" -> Check if an email address is real/deliverable.
- "/report" -> Report a scammer to the community.
- "/subscription" -> Upgrade their plan.

If the user asks for help, suggest the most relevant tool.
OUTPUT FORMAT: Return a JSON object ONLY. No markdown.
{
  "reply": "Your friendly response here.",
  "action": { "label": "Button Text", "url": "/relevant/link" } // or null
}
`;

export async function POST(req) {
    try {
        const { message } = await req.json();
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                reply: "I'm having trouble connecting to my brain (API Key missing).",
                action: null
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

        const result = await chat.sendMessage(message);
        const response = result.response;
        let text = response.text();

        // Clean up markdown code blocks if the model adds them despite instructions
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const json = JSON.parse(text);
            return NextResponse.json(json);
        } catch (e) {
            console.error("AI JSON Parse Error:", text);
            return NextResponse.json({
                reply: "I found a match, but my internal parser failed. Try the menu above.",
                action: { label: "Explore Tools", url: "/#tools" }
            });
        }

    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({
            reply: "System overload. Please try again later.",
            action: null
        }, { status: 500 });
    }
}
