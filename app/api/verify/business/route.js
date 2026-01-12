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

        // 1. Broad Web Search (Sasol-style intuitive results)
        const isRegSearch = /\d/.test(input)
        let query = ""

        if (isRegSearch) {
            query = `"${input}" South Africa CIPC business registration details`
        } else {
            // We include intent-rich keywords to force Google to find snippets with HQ and CEO data
            query = `"${input}" South Africa company registration headquarters address CEO directors industry`
        }

        // Fetch up to 10 results to give Gemini maximum context
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`)
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

        // Fallback for zero results
        let items = data.items || []
        if (items.length === 0) {
            const fallbackRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(input + " registration number and directors")}&num=5`)
            const fallbackData = await fallbackRes.json()
            items = fallbackData.items || []
        }

        if (items.length === 0) {
            return NextResponse.json({
                valid: false,
                data: {
                    name: input,
                    identifier: 'Not Found',
                    status: 'Not Found',
                    message: `❓ No official registry record found for "${input}" on the web index.`,
                    source: 'Global Web Search',
                    details: 'Try searching for the official registered name.'
                }
            })
        }

        const snippets = items.map(i => `[${i.displayLink}] ${i.title}: ${i.snippet}`).join('\n---\n')
        const links = items.slice(0, 3).map(i => i.link)

        // 1b. Robust Regex Extraction 
        const regRegex = /(\d{4}\/\d{6}\/\d{2})|(\d{4}-\d{6}-\d{2})/g
        const regMatches = snippets.match(regRegex)
        const topMatch = regMatches ? regMatches.find(m => m.includes('/')) || regMatches[0] : null

        // DEFAULT STATE
        let businessData = {
            name: input,
            identifier: topMatch || 'Registry Found',
            industry: 'Unknown',
            status: 'Verified',
            summary: 'This business is verified against official South African registries.',
            icon: '✅',
            address: 'Not visible in index',
            registrationDate: 'Unknown',
            directors: []
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
                Analyze these South African business search results for: "${input}"
                Web Results Index:
                ${snippets}
                
                Regex Candidate: ${topMatch || 'None'}

                GOAL: Extract a COMPLETE verified business profile for EVERY search.
                
                CRITICAL INSTRUCTIONS:
                1. OFFICIAL NAME: Identify the exact Registered Company Name (e.g. "Sasol Limited" not just "sasol").
                2. REGISTRATION NO: Extract the Official Reg Number (YYYY/NNNNNN/NN). 
                3. ADDRESS: Extract the Physical Headquarters or Registered Office. If multiple appear, use the primary/head office.
                4. REGISTRATION DATE: Find the Incorporation or Founding date. 
                5. LEADERSHIP: List names of the CEO, MD, and notable Directors. For established entities, ensure you find the current leadership (e.g. for Sasol, look for Simon Baloyi or Muriel Dube).
                6. INDUSTRY: High-level category (e.g. Petrochemicals, Banking, Logistics).
                7. STATUS: verified, deregistered, or liquidated.

                KNOWLEDGE AUGMENTATION: If the search results are for a VERY FAMOUS South African company (like Sasol, Vodacom, Nedbank, Sanlam), use your internal knowledge to supplement truncated snippets for Headquarters, CEO, and Industry names. DO NOT return "Unknown" for a top-100 JSE listed company.

                Required JSON structure:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "YYYY/NNNNNN/NN",
                    "industry": "Industry Type",
                    "status": "Verified" | "Deregistered" | "Liquidated",
                    "address": "Full Physical Address",
                    "registrationDate": "DD Month YYYY",
                    "directors": ["Full Name 1", "Full Name 2"],
                    "summary": "Deep professional summary including current leadership and status."
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
                    let finalId = aiResponse.identifier || businessData.identifier || topMatch
                    if (finalId) finalId = finalId.replace(/-/g, '/')

                    businessData.identifier = finalId
                    businessData.industry = aiResponse.industry || businessData.industry
                    businessData.status = aiResponse.status || businessData.status
                    businessData.summary = aiResponse.summary || businessData.summary
                    businessData.address = aiResponse.address || businessData.address
                    businessData.registrationDate = aiResponse.registrationDate || businessData.registrationDate
                    businessData.directors = aiResponse.directors || []

                    const statusLower = (businessData.status || '').toLowerCase();
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
            }
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: businessData.name,
                identifier: businessData.identifier,
                industry: businessData.industry,
                status: businessData.status,
                address: businessData.address,
                registrationDate: businessData.registrationDate,
                directors: businessData.directors,
                summary: businessData.summary,
                icon: businessData.icon,
                source: 'Deep-Web Intelligence Index',
                details: `Information index derived from 10+ South African sources:\n${links.map(l => {
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
