import { NextResponse } from 'next/server'
// import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

// Initialize Gemini
// We init this lazily inside the handler to ensure env var is picked up if hot-reloaded
// const getGenModel = (apiKey) => {
//     const genAI = new GoogleGenerativeAI(apiKey)
//     return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
// }

export async function POST(request) {
    const { input } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'undefined') {
        return NextResponse.json({
            valid: false,
            data: {
                status: 'Config Error',
                message: 'GEMINI_API_KEY is missing from Cloudflare Settings.',
                details: 'Please ensure GEMINI_API_KEY is set in the Cloudflare Pages dashboard.'
            }
        })
    }

    try {
        console.log(`[Verify] Querying Gemini for: ${input}`)
        // Dynamic import to prevent Edge startup crash
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey.trim())

        let model
        try {
            // Attempt to get the latest flash model
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
        } catch (mErr) {
            // Fallback to standard flash if latest alias fails
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        }

        // Construct a strict prompt for consistent JSON output
        const prompt = `
        You are a business verification agent for South Africa.
        Analyze the company or entity: "${input}".
        
        Task:
        1. Determine if this appears to be a real, legitimate South African business.
        2. Estimate its status (Active, Deregistered, Suspicious, Unknown).
        3. Provide a brief 1-sentence summary of what they do.
        4. Find 3 authoritative external URLs (links) that validate them (e.g. CIPC, LinkedIn, Official Site, News, HelloPeter).
        
        Output stricly in this JSON format (no markdown code blocks):
        {
            "name": "Official Business Name",
            "identifier": "Registration Number or 'Unknown'",
            "status": "Active" | "Deregistered" | "Suspicious" | "Unknown",
            "summary": "Short description.",
            "links": ["url1", "url2", "url3"]
        }
        
        If you genuinely cannot find any trace of it in South Africa, set status to "Unknown" and summary to "No digital footprint found.".
        `

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // clean up code fences if Gemini adds them despite instructions
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(cleanJson)

        // Map AI response to frontend format
        let statusColor = 'Unknown'
        let icon = '❓'

        const aiStatus = data.status.toLowerCase()
        if (aiStatus.includes('active')) {
            statusColor = 'Active Record Found'
            icon = '✅'
        } else if (aiStatus.includes('suspicious')) {
            statusColor = 'Caution: Suspicious'
            icon = '⚠️'
        } else if (aiStatus.includes('deregistered')) {
            statusColor = 'Deregistered'
            icon = '❌'
        }

        // Format links for display
        const linkList = data.links && data.links.length > 0
            ? data.links.map(l => `• ${new URL(l).hostname}`).join('\n')
            : 'No direct links found.'

        return NextResponse.json({
            valid: aiStatus !== 'unknown',
            data: {
                name: data.name,
                identifier: data.identifier,
                status: statusColor,
                message: `${icon} AI Analysis: ${data.summary}`,
                source: 'Google Gemini Analysis',
                details: `References Found:\n${linkList}`
            }
        })

    } catch (e) {
        console.error('[Verify] Gemini Error:', e)
        return NextResponse.json({
            valid: false,
            data: {
                status: 'AI Error',
                message: `AI Analysis failed: ${e.message}`,
                details: e.message
            }
        })
    }
}
