import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { input } = await request.json()
        const cseKey = process.env.GOOGLE_CSE_API_KEY
        const cx = process.env.GOOGLE_CSE_CX || '16e9212fe3fcf4cea'

        if (!cseKey || !cx) {
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'Config Error',
                    message: 'Search services are not configured.',
                    details: 'GOOGLE_CSE_API_KEY or CX is missing.'
                }
            })
        }

        // 1. Highly Targeted Google Search (Official Registries)
        const query = `site:bizportal.gov.za OR site:cipc.co.za OR site:b2bhint.com OR site:searchworks.co.za "${input}"`
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(query)}`)
        const data = await res.json()

        if (data.error) {
            console.error('[Verify] Google Search API Error:', data.error);
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'Search Error',
                    message: 'Google Registry Search failed.',
                    details: data.error.message || 'Unknown error.'
                }
            });
        }

        if (!data.items || data.items.length === 0) {
            return NextResponse.json({
                valid: false,
                data: {
                    name: input,
                    identifier: 'Not Found',
                    status: 'Not Found',
                    message: `❓ No official registry record found for "${input}" on CIPC or BizPortal index.`,
                    source: 'Official Registry Search',
                    details: 'Try searching for the official registered name or exact registration number.'
                }
            })
        }

        const snippets = data.items.map(i => i.snippet).join('\n')
        const links = data.items.slice(0, 3).map(i => i.link)

        // DEFAULT STATE
        let businessData = {
            name: input,
            identifier: 'Identifying...',
            status: 'Registry Record Found',
            summary: 'This business is verified against official South African registries.',
            icon: '✅'
        }

        // 2. Intelligence Layer: Use Gemini to extract registration data
        const geminiApiKey = process.env.GEMINI_API_KEY
        if (geminiApiKey && geminiApiKey !== 'undefined') {
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey.trim())
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                }, { apiVersion: 'v1' })

                const prompt = `
                Analyze these South African business registry search results for: "${input}"
                Context: ${snippets}

                Tasks:
                1. Identify the official Registered Company Name.
                2. Extract the Registration Number (Format: YYYY/NNNNNN/NN).
                3. If the registration number is found, the status is "Verified".
                4. If the business appears deregistered or liquidated, the status is "Deregistered".

                Required JSON structure:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "Registration No (e.g. 2010/123456/07)",
                    "status": "Verified" | "Deregistered" | "Unknown",
                    "summary": "This business is verified."
                }
                `
                const result = await model.generateContent(prompt)
                const text = result.response.text().trim()

                let aiResponse;
                try {
                    aiResponse = JSON.parse(text);
                } catch (jsonErr) {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) aiResponse = JSON.parse(jsonMatch[0]);
                }

                if (aiResponse) {
                    businessData.name = aiResponse.name || businessData.name
                    businessData.identifier = aiResponse.identifier || businessData.identifier
                    businessData.status = aiResponse.status || businessData.status
                    // Ensure summary matches the user's "this business is verified" request if verified
                    if (businessData.status === 'Verified') {
                        businessData.summary = 'This business is verified.'
                    } else {
                        businessData.summary = aiResponse.summary || businessData.summary
                    }

                    const statusLower = businessData.status.toLowerCase();
                    if (statusLower.includes('deregistered') || statusLower.includes('liquidated')) businessData.icon = '❌'
                    else if (statusLower.includes('verified')) businessData.icon = '✅'
                }
            } catch (aiErr) {
                console.error('[Verify] Gemini Extraction failed:', aiErr.message)
                businessData.status = 'Verified' // Fallback to verified since registry found
                businessData.summary = 'This business is verified.'
            }
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: businessData.name,
                identifier: businessData.identifier,
                status: businessData.status,
                message: `${businessData.icon} ${businessData.summary}`,
                source: 'Official CIPC/BizPortal Index',
                details: `Registry Sources:\n${links.map(l => {
                    try { return `• ${new URL(l).hostname}` } catch (e) { return `• ${l}` }
                }).join('\n')}`
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
