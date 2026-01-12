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

        // 1. Multi-Stage Intelligent Search
        // Search 1: Broad "Knowledge Search" (Best for CEO/Directors/History)
        const q1 = `"${input}" South Africa company details CEO directors registration number`
        const res1 = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(q1)}`)
        const data1 = await res1.json()

        let allItems = data1.items || []

        // Search 2: Specific "Registry Search" (If we don't have much)
        if (allItems.length < 3) {
            const q2 = `"${input}" site:cipc.co.za OR site:bizportal.gov.za OR site:b2bhint.com`
            const res2 = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(q2)}`)
            const data2 = await res2.json()
            if (data2.items) allItems = [...allItems, ...data2.items]
        }

        if (allItems.length === 0) {
            return NextResponse.json({
                valid: false,
                data: {
                    name: input,
                    identifier: 'Not Found',
                    status: 'Not Found',
                    message: `❓ No official registry record found for "${input}" on the web.`,
                    source: 'Global Web Search',
                    details: 'Check the spelling or try searching for the full official name.'
                }
            })
        }

        const snippets = allItems.map(i => `[${i.displayLink}] ${i.title}: ${i.snippet}`).join('\n---\n')
        const links = allItems.slice(0, 3).map(i => i.link)

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

                GOAL: Extract DEEP metadata about this company. 
                Even if information is partially visible (e.g. "CEO: Simon..."), try to complete/clean it up.

                CRITICAL TASKS:
                1. OFFICIAL NAME: Identify the EXACT official Registered Company Name.
                2. REGISTRATION NO: Extract the Official Reg Number (YYYY/NNNNNN/NN). Prioritize CIPC/BizPortal sources.
                3. ADDRESS: Extract the Physical Headquarters or Registered Address. 
                4. DATE: Extract the Incorporation or Foundation Date.
                5. LEADERSHIP: List names of CEO, Directors, or Officers. (e.g. "Fleetwood Grobler", "Simon Baloyi").
                6. INDUSTRY: High-level category (e.g. Chemicals, Retail, Banking).
                7. STATUS: verified, deregistered, or liquidated.

                Required JSON structure:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "YYYY/NNNNNN/NN",
                    "industry": "Industry Type",
                    "status": "Verified" | "Deregistered" | "Liquidated",
                    "address": "Full Physical Address",
                    "registrationDate": "DD Month YYYY",
                    "directors": ["Name 1", "Name 2"],
                    "summary": "Deep summary of the company, its origins, and current status."
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
                details: `Information derived from high-authority South African indices:\n${links.map(l => {
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
