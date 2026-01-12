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
                    message: `❓ No official registry record found for "${input}" on CIPC or BizPortal index.`,
                    source: 'Official Registry Search',
                    details: 'Try searching for the official registered name or exact registration number.'
                }
            })
        }

        const snippets = data.items.map(i => i.snippet).join('\n')
        const links = data.items.slice(0, 3).map(i => i.link)

        let businessData = {
            name: input,
            identifier: 'Analyzing...',
            status: 'Processing',
            summary: 'Verifying data against CIPC/BizPortal records...',
            icon: '🔍'
        }

        // 2. Intelligence Layer: Use Gemini to extract registration data from indexed results
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
                Analyze these search results from official South African business registries for: "${input}"
                
                Search Context:
                ${snippets}

                Tasks:
                1. Identify the most accurate Registered Company Name.
                2. Extract the Registration Number (Format: YYYY/NNNNNN/NN).
                3. Determine the Status (e.g. In Business, Deregistered, Liquidated).
                4. Write a concise summary confirming if this was found in the official CIPC/BizPortal records.

                Required JSON structure:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "Registration No",
                    "status": "In Business" | "Deregistered" | "Suspicious" | "Unknown",
                    "summary": "Full professional summary of legitimacy based on the registry findings."
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
                }

                const statusLower = businessData.status.toLowerCase();
                if (statusLower.includes('deregistered') || statusLower.includes('liquidated') || statusLower.includes('removed')) businessData.icon = '❌'
                else if (statusLower.includes('suspicious') || statusLower.includes('caution')) businessData.icon = '⚠️'
                else if (statusLower.includes('business') || statusLower.includes('active')) businessData.icon = '✅'
                else businessData.icon = '❓'

            } catch (aiErr) {
                console.error('[Verify] Gemini Extraction failed:', aiErr.message)
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
                details: `Source Context:\n${links.map(l => `• ${new URL(l).hostname}`).join('\n')}`
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
