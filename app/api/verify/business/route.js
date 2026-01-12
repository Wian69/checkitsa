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
        // We add "registration number" or "CIPC" to the query to force relevant snippets
        const isRegSearch = /\d/.test(input)
        const searchQuery = isRegSearch ? `"${input}" CIPC registration` : `"${input}" South Africa registration number CIPC`
        const query = `site:bizportal.gov.za OR site:cipc.co.za OR site:b2bhint.com OR site:searchworks.co.za OR site:sacompany.co.za ${searchQuery}`

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

        const snippets = data.items.map(i => `${i.title}: ${i.snippet}`).join('\n---\n')
        const links = data.items.slice(0, 3).map(i => i.link)

        // 1b. Robust Regex Extraction (SA Registration Format: YYYY/NNNNNN/NN or YYYY-NNNNNN-NN)
        const regRegex = /(\d{4}\/\d{6}\/\d{2})|(\d{4}-\d{6}-\d{2})/g
        const regMatches = snippets.match(regRegex)
        // Prioritize the slashed version
        const topMatch = regMatches ? regMatches.find(m => m.includes('/')) || regMatches[0] : null

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
                Context from Google:
                ${snippets}
                
                Regex Candidate: ${topMatch || 'None'}

                CRITICAL TASKS:
                1. Identify the EXACT official Registered Company Name. Avoid generic placeholders.
                2. Extract the Official Registration Number (Format MUST BE: YYYY/NNNNNN/NN). 
                   - Look for terms like "Registration No", "Reg No", "Enterprise Number".
                   - If multiple numbers exist, pick the one from an official-looking source (CIPC, BizPortal, B2BHint).
                   - Use the Regex Candidate if it fits the YYYY/NNNNNN/NN format exactly.
                3. Identify the Primary Industry (e.g. Retail, Mining, Finance, Tech).
                4. Determine Status: "Verified" (Active), "Deregistered", or "Liquidated".

                Required JSON structure:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "YYYY/NNNNNN/NN",
                    "industry": "Industry Type",
                    "status": "Verified" | "Deregistered" | "Liquidated",
                    "summary": "Full summary including when it was registered if visible."
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
                    // Ensure the identifier is cleaned up
                    let finalId = aiResponse.identifier || businessData.identifier || topMatch
                    if (finalId) finalId = finalId.replace(/-/g, '/') // Standardize to slashes

                    businessData.identifier = finalId
                    businessData.industry = aiResponse.industry || businessData.industry
                    businessData.status = aiResponse.status || businessData.status
                    businessData.summary = aiResponse.summary || businessData.summary

                    const statusLower = businessData.status.toLowerCase();
                    if (statusLower.includes('deregistered') || statusLower.includes('liquidated') || statusLower.includes('dissolved')) {
                        businessData.icon = '❌'
                        businessData.status = 'Deregistered'
                    } else {
                        businessData.icon = '✅'
                        businessData.status = 'Verified'
                    }
                }
            } catch (aiErr) {
                console.error('[Verify] Gemini Extraction failed:', aiErr.message)
                businessData.status = 'Verified'
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
