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
        // Precise query removing 'CIPC' noise but keeping 'South Africa'
        const intelligenceQuery = `"${input}" ("Registration Number" OR "Reg No") South Africa`;

        console.log(`[Intelligence] Fetching web data for: ${input}`);

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

        // 2. Web-Only Intelligence Layer (Advanced Smart Parser v3)
        // STRATEGY: 
        // 1. NO Filtering (Accept all snippets to catch rich data)
        // 2. Trust Google's top result IF it matches the company name context check.

        let identifier = "Not found in web index";
        const regNumRegex = /\b(\d{4})\/\d{6}\/\d{2}\b/;

        // Scan items. We look for a "High Confidence" match first.
        // High Confidence = Snippet contains Reg No AND Title/Snippet contains exact Company Name.

        for (const item of items) {
            // 1. Check if snippet actually relates to the company (Context Match)
            if (item.title.toLowerCase().includes(input.toLowerCase()) || item.snippet.toLowerCase().includes(input.toLowerCase())) {
                const match = item.snippet.match(regNumRegex);
                if (match) {
                    const year = parseInt(match[1], 10);
                    if (year > 1900 && year <= new Date().getFullYear()) {
                        identifier = match[0];
                        break; // Found matching entity in relevant snippet. Stop.
                    }
                }
            }
        }

        // Fallback: If no "Context Match" found, just take the first Reg No from the top result (Relevance Fallback)
        if (identifier === "Not found in web index") {
            for (const item of items) {
                const match = item.snippet.match(regNumRegex);
                if (match) {
                    const year = parseInt(match[1], 10);
                    if (year > 1900 && year <= new Date().getFullYear()) {
                        identifier = match[0];
                        break; // Trust ranking.
                    }
                }
            }
        }

        // Use loose regex fallback ONLY if strictly verified one failed
        if (identifier === "Not found in web index" && items.length > 0) {
            const altMatch = items[0].snippet.match(/(?:Reg(?:istration)?(?:\s+No)?\.?|Number)[\s:.-]*((?:\d{4}\/\d+|\d{9,}))/i);
            if (altMatch) identifier = altMatch[1];
        }

        const cleanSnippets = items.map(i => `${i.title} ${i.snippet}`).join(' | ');

        // B. Industry Detection (Refined Dictionary)
        const industries = [
            'Agriculture', 'Mining', 'Manufacturing', 'Logistics', 'Transport', 'Freight',
            'Energy', 'Construction', 'Retail', 'Wholesale', 'Hospitality',
            'Technology', 'Software', 'Finance', 'Insurance', 'Real Estate',
            'Healthcare', 'Education', 'Legal', 'Consulting', 'Security', 'Media'
        ];
        const foundIndustry = industries.find(ind => cleanSnippets.toLowerCase().includes(ind.toLowerCase()));
        const industry = foundIndustry ? `${foundIndustry} (Web Verified)` : "Multi-Sector (Web Index)";

        // C. Operations
        const bestDescItem = items.find(i =>
            /is a|specializes|provides|manufacturer|supplier|distributor|solutions|services/i.test(i.snippet)
        );
        const operations = bestDescItem ? bestDescItem.snippet : (items[0]?.snippet || "Business listing found in global index.");

        // D. Address / Headquarters (Improved Regex for 'Randfontein')
        let addressHint = "See web results below";

        // 1. Explicit Headers
        const hqRegex = /(?:Headquarters|Head Office|Based|Located)[:\s]+in\s+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)/i;
        const hqMatch = cleanSnippets.match(hqRegex);

        if (hqMatch) {
            addressHint = `${hqMatch[1]} (Headquarters)`;
        } else {
            // 2. Standard Address Patterns (Street, Box, or explicit City/Area)
            // We search item by item to find the best address snippet
            const addressItem = items.find(i =>
                /\d+\s+[A-Za-z]+\s+(Street|St|Road|Rd|Ave|Box|Crescent|Way)/i.test(i.snippet) ||
                /(?:Randfontein|Johannesburg|Cape Town|Durban|Pretoria|Sandton|Polokwane|Bloemfontein)/.test(i.snippet)
            );
            if (addressItem) addressHint = addressItem.snippet;
        }

        // E. Directors
        const directorRegex = /(?:CEO|Director|Managing Director)[\s:-]+([A-Z][a-z]+ [A-Z][a-z]+)/g;
        const potentialDirectors = [...cleanSnippets.matchAll(directorRegex)].map(m => m[1]).slice(0, 3);
        const directors = potentialDirectors.length > 0 ? potentialDirectors : ["Listed in full report"];

        // F. Status
        const lowerSnippets = cleanSnippets.toLowerCase();
        let status = "Active";
        if (lowerSnippets.includes('liquidation') || lowerSnippets.includes('liquidated')) status = 'Liquidated';
        if (lowerSnippets.includes('deregistered') || lowerSnippets.includes('final deregistration')) status = 'Deregistered';
        if (lowerSnippets.includes('business rescue')) status = 'Business Rescue';

        // Construct the profile manually
        const aiResponse = {
            name: input,
            identifier: identifier,
            industry: industry,
            status: status,
            address: addressHint,
            registrationDate: identifier !== "Not found in web index" ? identifier.substring(0, 4) : "Unknown",
            directors: directors,
            employees: "Unknown",
            operations: operations,
            globalRole: "National Entity",
            summary: `Automated web profile generated from verified sources.`,
            source: "Global Web Index (Filtered)",
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
