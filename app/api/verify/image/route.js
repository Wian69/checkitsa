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

        // --- GEMINI VISION ANALYSIS (Robust Multi-Model Failover) ---
        const genAI = new GoogleGenerativeAI(geminiKey)
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-vision"]
        let result = null
        let lastError = null
        let successModel = null

        // Try models in sequence
        for (const modelName of modelsToTry) {
            try {
                console.log(`[Vision] Attempting analysis with: ${modelName}`)
                const model = genAI.getGenerativeModel({ model: modelName })
                result = await model.generateContent([
                    prompt,
                    { inlineData: { data: image, mimeType: mimeType || 'image/png' } }
                ])
                successModel = modelName
                break // Success! Exit loop
            } catch (err) {
                console.warn(`[Vision] Failed with ${modelName}:`, err.message)
                lastError = err
                // Continue to next model...
            }
        }

        if (!result && lastError) {
            throw lastError // All models failed, throw the last error to be caught by main handler
        }

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

        // DIAGNOSTIC: List available models if 404 occurs
        let availableModels = "Unable to list models"
        try {
            if (error.message.includes('404') || error.message.includes('not found')) {
                // Temporary new instance to list models - use fetch directly to avoid SDK restrictions
                const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`)
                const listData = await listRes.json()
                if (listData.models) {
                    availableModels = listData.models.map(m => m.name).join(', ')
                }
            }
        } catch (listErr) {
            console.error("Model List Error", listErr)
        }

        // Diagnose 404 (Model not found / API not enabled)
        if (error.message.includes('404') || error.message.includes('not found')) {
            return NextResponse.json({
                error: 'Configuration Error',
                message: 'The AI model could not be found via your API Key.',
                risk_score: 0,
                flags: [
                    'API Key Valid: Yes',
                    `Available Models: ${availableModels}`,
                    'Action: Please verify "Generative Language API" is enabled.'
                ],
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
