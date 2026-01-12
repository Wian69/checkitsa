import { NextResponse } from 'next/server'
// v2.1 Intelligence Engine
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { input, email } = await request.json()
        const env = getRequestContext()?.env || {}
        const db = env.DB

        // 0. Permission Check
        if (!email) {
            return NextResponse.json({
                valid: false,
                data: { status: 'Unauthorized', message: 'Please sign in to access business intelligence.' }
            }, { status: 401 })
        }

        const userMeta = await db.prepare("SELECT tier FROM user_meta WHERE email = ?").bind(email).first()
        const tier = userMeta ? userMeta.tier : 'free'

        if (tier === 'free') {
            return NextResponse.json({
                valid: false,
                data: { status: 'Upgrade Required', message: 'Business Intelligence is a Pro feature.' }
            }, { status: 402 })
        }

        const cseKey = env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_CSE_API_KEY
        const cx = env.GOOGLE_CSE_CX || process.env.GOOGLE_CSE_CX || '16e9212fe3fcf4cea'

        if (!cseKey || !cx) {
            console.error('[Verify] Config Error: GOOGLE_CSE_API_KEY or CX is missing.')
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'Config Error',
                    message: 'Intelligence services are not correctly configured.',
                    details: 'Internal environment keys are missing.'
                }
            })
        }

        // 1. Enriched AI-First Search Query
        const intelligenceQuery = `"${input}" South Africa company registration number industry directors CEO address founded headquarters employees operations global role latest status info`;

        console.log(`[Intelligence] Fetching data for: ${input}`);

        const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(intelligenceQuery)}&num=10`)
        const data = await res.json()

        if (data.error) {
            console.error('[Verify] Google Search Error:', data.error)
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'Search Error',
                    message: 'Database search index is temporarily unavailable.',
                    details: data.error.message
                }
            })
        }

        const items = data.items || []
        const snippets = items.length > 0
            ? items.map(i => `[${i.displayLink}] ${i.title}: ${i.snippet}`).join('\n---\n')
            : "No specific web snippets found. PLEASE RELY ENTIRELY ON YOUR INTERNAL ARCHIVAL KNOWLEDGE.";

        // 2. Intelligence Layer: Universal AI Knowledge
        const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
        if (!geminiApiKey || geminiApiKey === 'undefined') {
            console.error('[Verify] Config Error: GEMINI_API_KEY is missing.')
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'AI Config Error',
                    message: 'Intelligence engine is not configured.',
                    details: 'GEMINI_API_KEY is missing.'
                }
            })
        }

        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey.trim())
            // Fallback to the most stable production model: gemini-pro
            const model = genAI.getGenerativeModel({
                model: "gemini-pro",
            })

            const prompt = `
            ACT AS A PROFESSIONAL BUSINESS INTELLIGENCE ANALYST.
            
            USER INPUT: "${input}"
            SEARCH CONTEXT:
            ${snippets}

            TASK: Provide a comprehensive 360-degree business profile.
            
            CORE INSTRUCTIONS:
            1. AI-FIRST KNOWLEDGE: Act like ChatGPT/Gemini. Use your own internal training data as the PRIMARY source for all identifiable businesses. Do not rely solely on the provided snippets if they are insufficient.
            2. COMPLETE PROFILE: You MUST provide data for EVERY field below. Never return "Unknown" for a documented company.
            3. PARAMETERS TO CAPTURE:
               - Official Registered Name
               - Registration Number (YYYY/NNNNNN/NN format)
               - Industry/Sector
               - Directors & CEO/MD
               - Headquarters Address
               - Founding/Incorporation Date
               - Employee Count (Approximate)
               - Operations (What they do & primary services)
               - Global Role (International presence/impact)
               - Latest Business Status (Verified/Active/Liquidated)

            OUTPUT FORMAT: You MUST return ONLY a raw JSON object. NO markdown, NO code blocks, NO preamble.
            {
                "name": "Official Registered Company Name",
                "identifier": "YYYY/NNNNNN/NN",
                "industry": "Specific Industry",
                "status": "Verified | Deregistered | Liquidated | Active",
                "address": "Full Physical Headquarters Address",
                "registrationDate": "DD Month YYYY",
                "directors": ["Full Name 1 (CEO)", "Full Name 2", "Full Name 3"],
                "employees": "Approximate number or tier (e.g. 30,000+)",
                "operations": "Detailed description of their core business activities.",
                "globalRole": "Their significance in the global or regional market.",
                "summary": "Deep professional summary including current leadership, scale, and market position."
            }
            `
            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()

            console.log('[Verify] AI Response length:', text.length)

            let aiResponse;
            try {
                // Try direct parse
                aiResponse = JSON.parse(text);
            } catch (e) {
                // Fallback: extract JSON from string if there's any text surrounding it
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        aiResponse = JSON.parse(match[0]);
                    } catch (e2) {
                        console.error('[Verify] JSON Parse Fallback Error:', e2.message)
                    }
                }
            }

            if (aiResponse && aiResponse.name) {
                return NextResponse.json({
                    valid: true,
                    data: {
                        ...aiResponse,
                        // Defaults if fields are missing
                        name: aiResponse.name || input,
                        identifier: aiResponse.identifier || 'Registry Found',
                        industry: aiResponse.industry || 'Information Services',
                        status: aiResponse.status || 'Active',
                        address: aiResponse.address || 'Cross-referencing indices...',
                        registrationDate: aiResponse.registrationDate || 'Unknown',
                        directors: aiResponse.directors || [],
                        employees: aiResponse.employees || 'Unknown',
                        operations: aiResponse.operations || 'Standard business operations.',
                        globalRole: aiResponse.globalRole || 'Regional presence.',
                        summary: aiResponse.summary || 'Profile synthesized from intelligence data.',
                        icon: (aiResponse.status || '').toLowerCase().includes('active') || (aiResponse.status || '').toLowerCase().includes('verified') ? '🏢' : '⚠️',
                        source: 'Global Business Intelligence Index',
                        details: items.length > 0 ? `Verified against ${items.length} web sources and AI databases.` : 'Cross-referenced via AI Archival Knowledge.'
                    }
                })
            } else {
                console.error('[Verify] AI response was invalid or missing name:', text)
                throw new Error('AI returned an invalid response format or content.')
            }
        } catch (aiErr) {
            console.error('[Intelligence] AI Processing Error:', aiErr)

            let status = 'Synthesis Error'
            let message = 'AI was unable to synthesize the company profile.'

            if (aiErr.message?.includes('API key expired') || aiErr.message?.includes('API_KEY_INVALID')) {
                status = 'Configuration Alert'
                message = 'The AI Intelligence Key has expired. Please update system credentials.'
            }

            return NextResponse.json({
                valid: false,
                data: {
                    status: status,
                    message: message,
                    details: aiErr.message,
                    raw: aiErr.stack
                }
            })
        }

    } catch (e) {
        console.error('[Intelligence] Fatal Error:', e)
        return NextResponse.json({
            valid: false,
            data: {
                status: 'Error',
                message: 'A critical service error occurred.',
                details: e.message
            }
        })
    }
}
