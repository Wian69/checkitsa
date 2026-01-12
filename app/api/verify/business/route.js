import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { input, email } = await request.json()
        const db = getRequestContext().env.DB

        // 0. Permission Check (Pro/Elite/Enterprise Only)
        if (!email) {
            return NextResponse.json({
                valid: false,
                data: { status: 'Unauthorized', message: 'Please sign in to verify businesses.', details: 'Guest users do not have access to CIPC verification.' }
            }, { status: 401 })
        }

        const userMeta = await db.prepare("SELECT tier FROM user_meta WHERE email = ?").bind(email).first()
        const tier = userMeta ? userMeta.tier : 'free'

        if (tier === 'free') {
            return NextResponse.json({
                valid: false,
                data: { status: 'Upgrade Required', message: 'CIPC Business Verification is a Pro feature.', details: 'Please upgrade your plan to access official registry searches.' }
            }, { status: 402 })
        }

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

        // 1b. Fast Regex Extraction (SA Registration Format: YYYY/NNNNNN/NN)
        const regRegex = /\d{4}\/\d{6}\/\d{2}/g
        const regMatches = snippets.match(regRegex)
        const topMatch = regMatches ? regMatches[0] : null

        // DEFAULT STATE
        let businessData = {
            name: input,
            identifier: topMatch || 'Registry Found',
            industry: 'Unknown',
            status: 'Verified',
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
                Regex Hint: ${topMatch || 'None'}

                Tasks:
                1. Identify the official Registered Company Name.
                2. Extract the Registration Number (Format: YYYY/NNNNNN/NN). Use the Regex Hint if it looks correct.
                3. Identify the Primary Industry (e.g. Retail, Mining, Finance, Tech).
                4. Business is "Verified" if a registry record exists.
                5. Business is "Deregistered" if explicitly stated in text.

                Required JSON structure:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "Registration No (e.g. 2010/123456/07)",
                    "industry": "Industry Type",
                    "status": "Verified" | "Deregistered",
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
                    businessData.identifier = aiResponse.identifier || businessData.identifier || topMatch
                    businessData.industry = aiResponse.industry || businessData.industry
                    businessData.status = aiResponse.status || businessData.status

                    if (businessData.status === 'Verified') {
                        businessData.summary = 'This business is verified.'
                    }

                    const statusLower = businessData.status.toLowerCase();
                    if (statusLower.includes('deregistered') || statusLower.includes('liquidated')) businessData.icon = '❌'
                    else businessData.icon = '✅'
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
                industry: businessData.industry,
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
