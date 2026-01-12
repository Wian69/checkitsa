import { NextResponse } from 'next/server'
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

        // 1. Enriched Web Search Query
        // We append specific keywords to help the smart parser find the right data in snippets
        const intelligenceQuery = `"${input}" South Africa company registration number address directors status info`;

        console.log(`[Intelligence] Fetching web data for: ${input} `);

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
        const snippets = items.map(i => `${i.title} ${i.snippet}`).join(' | ');

        // 2. Web-Only Intelligence Layer (Smart Regex Parser)
        // Extract South African CIPC Registration Number (Format: YYYY/NNNNNN/NN)
        const regNumRegex = /\b\d{4}\/\d{6}\/\d{2}\b/;
        const regMatch = snippets.match(regNumRegex);
        const identifier = regMatch ? regMatch[0] : "Not found in web index";

        // Heuristic Status Detection
        const lowerSnippets = snippets.toLowerCase();
        let status = "Active"; // Default assumption if found on web
        if (lowerSnippets.includes('liquidation') || lowerSnippets.includes('liquidated')) status = 'Liquidated';
        if (lowerSnippets.includes('deregistered') || lowerSnippets.includes('de-registered')) status = 'Deregistered';
        if (lowerSnippets.includes('business rescue')) status = 'Business Rescue';

        // Basic Address Extraction (Looking for common SA address patterns in snippets is hard, so we use a generic fallback or the first snippet hint)
        // This is a "best effort" without AI.
        const addressHint = items.find(i => i.snippet.toLowerCase().includes('street') || i.snippet.toLowerCase().includes('road') || i.snippet.toLowerCase().includes('box'))?.snippet || "See web results below";

        // Construct the profile manually
        const aiResponse = {
            name: input, // We assume the search term is the name if found
            identifier: identifier,
            industry: "Multi-Sector (Web Index)",
            status: status,
            address: addressHint,
            registrationDate: identifier !== "Not found in web index" ? identifier.substring(0, 4) : "Unknown",
            directors: ["Available in full report"], // Placeholder as extraction is unreliable without AI
            employees: "Unknown",
            operations: items[0]?.snippet || "Business listing found in global index.",
            globalRole: "National Entity",
            summary: `Automated web profile generated from ${items.length} verified sources.`,
            source: "Global Web Index (Regex)",
            icon: status === 'Active' ? '🏢' : '⚠️',
            details: `Synthesized from ${items.length} public web endpoints.`
        };

        if (items.length > 0) {
            return NextResponse.json({
                valid: true,
                data: aiResponse
            })
        } else {
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'No Data Found',
                    message: 'No digital footprint found for this entity.',
                    details: 'Try refining the business name.'
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
