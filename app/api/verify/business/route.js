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
    try {
        const { input } = await request.json()

        // --- API KEY AUTHENTICATION ---
        const authHeader = request.headers.get('Authorization')
        let isApiRequest = false

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const apiKey = authHeader.split(' ')[1]
            const db = getRequestContext().env.DB

            // Verify Key
            const user = await db.prepare('SELECT * FROM users WHERE api_key = ?').bind(apiKey).first()

            if (!user) {
                return NextResponse.json({
                    valid: false,
                    data: { status: 'Unauthorized', message: 'Invalid API Key' }
                }, { status: 401 })
            }

            // Check Quota (Basic Implementation: strictly relying on subscription status for now)
            if (user.tier !== 'elite' && user.tier !== 'custom' && user.tier !== 'ultimate') {
                return NextResponse.json({
                    valid: false,
                    data: { status: 'Forbidden', message: 'API access requires Elite or Enterprise plan.' }
                }, { status: 403 })
            }

            isApiRequest = true
            // TODO: Increment API Usage Counter here
        }
        // ------------------------------

        const cseKey = process.env.GOOGLE_CSE_API_KEY
        // Use the specific CX provided by the user if the env var is missing or incorrect
        const cx = process.env.GOOGLE_CSE_CX || '16e9212fe3fcf4cea'

        if (!cseKey || !cx) {
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'Config Error',
                    message: 'Search services are not configured.',
                    details: 'GOOGLE_CSE_API_KEY or CX is missing in Cloudflare dashboard.'
                }
            })
        }

        console.log(`[Verify] Google Search for: ${input}`)

        // 1. Fetch from Google Search
        const query = `"${input}" South Africa business registration OR linkedin OR contact`
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(query)}`)
        const data = await res.json()

        if (data.error) {
            console.error('[Verify] Google Search API Error:', data.error);
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'Search Error',
                    message: 'Google Search API failed.',
                    details: data.error.message || 'Unknown error from Google.'
                }
            });
        }

        if (!data.items || data.items.length === 0) {
            return NextResponse.json({
                valid: false,
                data: {
                    name: input,
                    identifier: 'Not Found',
                    status: 'Unknown',
                    message: `❓ No digital footprint found for "${input}" in South Africa.`,
                    source: 'Google Search Registry Check',
                    details: 'Try searching for the official registered name or registration number.'
                }
            })
        }

        const bestMatch = data.items[0]
        const snippets = data.items.map(i => i.snippet).join('\n')
        const links = data.items.slice(0, 3).map(i => i.link)

        let businessData = {
            name: bestMatch.title.split('-')[0].split('|')[0].trim(),
            identifier: 'Found via Web',
            status: 'Record Found',
            summary: bestMatch.snippet,
            icon: '✅'
        }

        // 3. Optional: Use Gemini to summarize the Google results (Intelligence Layer)
        const geminiApiKey = process.env.GEMINI_API_KEY
        if (geminiApiKey && geminiApiKey !== 'undefined') {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai')
                const genAI = new GoogleGenerativeAI(geminiApiKey.trim())
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                }, { apiVersion: 'v1' })

                const prompt = `
                Analyze these search results for "${input}" in South Africa.
                Search Context:
                ${snippets}

                Provide a structured verification report in JSON format.
                Required JSON structure:
                {
                    "name": "Most accurate company name",
                    "identifier": "Registration No (e.g. 2020/123456/07) or 'Not verified'",
                    "status": "Active" | "Suspicious" | "Deregistered" | "Unknown",
                    "summary": "Full professional summary of legitimacy and business type."
                }
                `
                const result = await model.generateContent(prompt)
                const text = result.response.text().trim()

                // Robust JSON parsing
                let aiResponse;
                try {
                    aiResponse = JSON.parse(text);
                } catch (jsonErr) {
                    // Fallback for when AI doesn't return pure JSON
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        aiResponse = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('AI response was not valid JSON');
                    }
                }

                businessData.name = aiResponse.name || businessData.name
                businessData.identifier = aiResponse.identifier || businessData.identifier
                businessData.status = aiResponse.status || businessData.status
                businessData.summary = aiResponse.summary || businessData.summary

                const statusLower = businessData.status.toLowerCase();
                if (statusLower.includes('suspicious') || statusLower.includes('caution')) businessData.icon = '⚠️'
                else if (statusLower.includes('deregistered') || statusLower.includes('liquidated')) businessData.icon = '❌'
                else if (statusLower.includes('active')) businessData.icon = '✅'

            } catch (aiErr) {
                console.error('[Verify] Gemini Summarization failed:', aiErr.message)
            }
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: businessData.name,
                identifier: businessData.identifier,
                status: businessData.status,
                message: `${businessData.icon} ${businessData.summary}`,
                source: 'Google verified search results',
                details: `Authoritative Links:\n${links.map(l => `• ${new URL(l).hostname}`).join('\n')}`
            }
        })

    } catch (e) {
        console.error('[Verify] Business Search Error:', e)
        return NextResponse.json({
            valid: false,
            data: {
                status: 'Error',
                message: 'Unable to perform business search.',
                details: e.message
            }
        })
    }
}
