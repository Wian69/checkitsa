import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { image, mimeType, email } = await request.json()
        const env = getRequestContext()?.env || {}
        const db = env.DB
        const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

        // 0. Permission Check
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized', message: 'Please sign in to analyze screenshots.' }, { status: 401 })
        }

        const userMeta = await db.prepare("SELECT tier FROM user_meta WHERE email = ?").bind(email).first()
        const tier = userMeta ? userMeta.tier : 'free'

        // Strict Tier Enforcement: Pro, Elite, or Custom
        const allowedTiers = ['pro', 'elite', 'custom']
        if (!allowedTiers.includes(tier)) {
            return NextResponse.json({
                error: 'Upgrade Required',
                message: 'Visual Fraud Analysis is a Premium Feature.',
                risk_score: 0,
                flags: ['Upgrade to Pro or Elite to use this feature.']
            }, { status: 402 })
        }

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 })
        }

        // --- GEMINI VISION ANALYSIS ---
        const genAI = new GoogleGenerativeAI(geminiKey)
        // Revert to Flash 1.5 (Standard). If this fails, user has not enabled API.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
        You are a Cyber Security Expert specializing in Social Engineering and Fraud Detection.
        Analyze this screenshot for signs of a scam.

        Look for:
        1. **Visual Mismatches:** Poorly aligned logos, bad fonts, fake UI elements (e.g. Android status bar on an email).
        2. **Brand Impersonation:** Is this pretending to be a bank (FNB, Capitec, Standard Bank), Post Office, or Courier?
        3. **Urgency/Threats:** Text demanding immediate payment or threatening account closure.
        4. **Suspicious Content:** "Payment Pending", "Winner", "Inheritance", "Clearance Fee".

        Return a JSON object:
        {
            "risk_score": 0-100,
            "verdict": "Safe" | "Suspicious" | "Dangerous",
            "flags": ["list", "of", "visual", "indicators"],
            "message": "A short, direct warning or confirmation message for the user.",
            "text_extracted": "Summary of visible text"
        }
        Do not include markdown formatting. Just raw JSON.
        `

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: image, mimeType: mimeType || 'image/png' } }
        ])

        const responseText = result.response.text()
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()

        let aiData
        try {
            aiData = JSON.parse(cleanJson)
        } catch (parseError) {
            console.error("JSON Parse Error", parseError)
            return NextResponse.json({
                error: 'Analysis Failed',
                message: 'AI could not process the image result.',
                risk_score: 0,
                flags: ['AI Error']
            }, { status: 500 })
        }

        return NextResponse.json(aiData)

    } catch (error) {
        console.error("Gemini API Error:", error)

        // Diagnose 404 (Model not found / API not enabled)
        if (error.message.includes('404') || error.message.includes('not found')) {
            return NextResponse.json({
                error: 'Configuration Error',
                message: 'Support for this AI model is not enabled on your API Key.',
                risk_score: 0,
                flags: ['Please enable "Generative Language API" in Google Cloud Console.'],
                text_extracted: ''
            }, { status: 503 })
        }

        return NextResponse.json({
            error: 'System Error',
            message: error.message || 'An unexpected error occurred during analysis.',
            risk_score: 0,
            flags: ['Analysis failed due to a system error.'],
            text_extracted: ''
        }, { status: 500 })
    }
}
