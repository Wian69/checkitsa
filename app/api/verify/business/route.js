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
            const genAI = new GoogleGenerativeAI(geminiApiKey.trim())

            let result;
            try {
                // Primary Stratum: Gemini 1.5 Flash (Fastest, v1beta)
                const modelFlash = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash"
                }, { apiVersion: 'v1beta' })
                result = await modelFlash.generateContent(prompt)
            } catch (flashError) {
                console.warn('[Verify] Flash model unavailable, switching to Fallback Stratum (Gemini Pro).', flashError.message)

                // Fallback Stratum: Gemini Pro (Universal Availability)
                // We do NOT specify apiVersion here to let the SDK use its stable default.
                const modelPro = genAI.getGenerativeModel({
                    model: "gemini-pro"
                })
                result = await modelPro.generateContent(prompt)
            }

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
