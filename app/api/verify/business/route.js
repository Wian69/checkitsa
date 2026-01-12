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

        // DEFAULT STATE if AI fails or is slow
        let businessData = {
            name: input,
            identifier: 'Registry Found',
            status: 'Registry Match Found',
            summary: 'Information found in official registries. Verifying details via AI...',
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
                Analyze these search results from official South African business registries for: "${input}"
                Context: ${snippets}

                Required JSON:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "Registration No (YYYY/NNNNNN/NN)",
                    "status": "In Business" | "Deregistered" | "Suspicious" | "Unknown",
                    "summary": "Confirm if this was found in CIPC/BizPortal records and provide brief status."
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
                    businessData.summary = aiResponse.summary || businessData.summary

                    const statusLower = businessData.status.toLowerCase();
                    if (statusLower.includes('deregistered') || statusLower.includes('liquidated') || statusLower.includes('removed')) businessData.icon = '❌'
                    else if (statusLower.includes('suspicious') || statusLower.includes('caution')) businessData.icon = '⚠️'
                    else businessData.icon = '✅'
                }
            } catch (aiErr) {
                console.error('[Verify] Gemini Extraction failed:', aiErr.message)
                businessData.status = 'Registry Found (Analysis Failed)'
            }
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: businessData.name,
                identifier: businessData.identifier,
                status: businessData.status,
                message: `${businessData.icon} ${businessData.summary}`,
                source: 'Official South African Registry Search',
                details: `Source Context:\n${links.map(l => {
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
