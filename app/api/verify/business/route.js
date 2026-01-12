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
        // UNIVERSAL QUERY: Works for ANY company name provided in 'input'
        // We ask for Registration Numbers OR Employees OR Headquarters to build a full profile.
        const intelligenceQuery = `"${input}" ("Registration Number" OR "Reg No" OR "Employees" OR "Headquarters") South Africa`;

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

        // 2. Web-Only Intelligence Layer (Universal Smart Parser v6)
        // Designed to be agnostic of company name/location.

        let identifier = "Not found in web index";
        const regNumRegex = /\b(\d{4})\/\d{6}\/\d{2}\b/;

        // Tiered Priority Search for ID
        // Tier 1: Title STARTS WITH input (Target: Official Homepage for THIS company)
        // Tier 2: Title CONTAINS input
        // Tier 3: Snippet CONTAINS input

        let tier1Match = null;
        let tier2Match = null;
        let tier3Match = null;

        for (const item of items) {
            const title = item.title.toLowerCase();
            const snippet = item.snippet.toLowerCase();
            const cleanInput = input.toLowerCase();

            const match = item.snippet.match(regNumRegex);
            if (match) {
                const year = parseInt(match[1], 10);
                if (year > 1900 && year <= new Date().getFullYear()) {

                    if (title.startsWith(cleanInput)) {
                        if (!tier1Match) tier1Match = match[0];
                    } else if (title.includes(cleanInput)) {
                        if (!tier2Match) tier2Match = match[0];
                    } else if (snippet.includes(cleanInput)) {
                        if (!tier3Match) tier3Match = match[0];
                    }
                }
            }
        }

        // Select best ID match
        if (tier1Match) identifier = tier1Match;
        else if (tier2Match) identifier = tier2Match;
        else if (tier3Match) identifier = tier3Match;
        else {
            // Fallback: First valid number found
            for (const item of items) {
                const match = item.snippet.match(regNumRegex);
                if (match) {
                    const year = parseInt(match[1], 10);
                    if (year > 1900 && year <= new Date().getFullYear()) {
                        identifier = match[0];
                        break;
                    }
                }
            }
        }

        // Loose Regex Fallback
        if (identifier === "Not found in web index" && items.length > 0) {
            const altMatch = items[0].snippet.match(/(?:Reg(?:istration)?(?:\s+No)?\.?|Number)[\s:.-]*((?:\d{4}\/\d+|\d{9,}))/i);
            if (altMatch) identifier = altMatch[1];
        }

        const cleanSnippets = items.map(i => `${i.title} ${i.snippet}`).join(' | ');

        // B. Industry (Universal Dictionary)
        const industries = [
            'Agriculture', 'Mining', 'Manufacturing', 'Logistics', 'Transport', 'Freight',
            'Retail', 'Wholesale', 'FMCG', 'Supermarket',
            'Energy', 'Construction', 'Hospitality',
            'Technology', 'Software', 'Finance', 'Insurance', 'Real Estate',
            'Healthcare', 'Education', 'Legal', 'Consulting', 'Security', 'Media'
        ];
        const foundIndustry = industries.find(ind => cleanSnippets.toLowerCase().includes(ind.toLowerCase()));
        const industry = foundIndustry ? `${foundIndustry} (Web Verified)` : "Multi-Sector (Web Index)";

        // C. Operations / Description
        // Look for structural description indicators
        const bestDescItem = items.find(i =>
            /(?:part of|subsidiary of|owned by|group|holding)/i.test(i.snippet) ||
            /is a|specializes|provides|manufacturer|supplier|distributor|solutions|services/i.test(i.snippet)
        );
        const operations = bestDescItem ? bestDescItem.snippet : (items[0]?.snippet || "Business listing found in global index.");

        // D. Address / Headquarters (Universal Pattern Match)
        let addressHint = "See web results below";

        // 1. Explicit Semantic Location (Headquarters in X, Based in Y)
        const hqRegex = /(?:Headquarters|Head Office|Based|Located)[:\s]+in\s+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)/i;
        const hqMatch = cleanSnippets.match(hqRegex);

        if (hqMatch) {
            addressHint = `${hqMatch[1]} (Headquarters)`;
        } else {
            // 2. Structural Address Patterns (Street Addresses)
            // Finds "123 Main Street" or "PO Box 123" patterns anywhere in text
            const addressMatches = items.filter(i =>
                /\d+\s+[A-Za-z0-9]+\s+(Street|St|Road|Rd|Ave|Avenue|Box|Crescent|Way|Drive|Lane|Park)/i.test(i.snippet)
            );
            // Prefer the one that matches title if possible
            const bestAddr = addressMatches.find(i => i.title.toLowerCase().includes(input.toLowerCase())) || addressMatches[0];

            if (bestAddr) addressHint = bestAddr.snippet;
        }

        // E. Directors (Universal Title Search)
        const directorRegex = /(?:CEO|Director|Managing Director|CFO|Founder|Owner)[\s:-]+([A-Z][a-z]+ [A-Z][a-z]+)/g;
        const potentialDirectors = [...cleanSnippets.matchAll(directorRegex)].map(m => m[1]).slice(0, 3);
        const directors = potentialDirectors.length > 0 ? potentialDirectors : ["Listed in full report"];

        // F. Employees (Natural Language Regex)
        const employeeRegex = /(?:employs|employing|staff of|workforce of)\s*(?:approx\.?|nearly|over|more than|approximately)?\s*([0-9,]+(?:\s+people|\s+employees|\s+staff)?)/i;
        const employeeMatch = cleanSnippets.match(employeeRegex);
        const employees = employeeMatch ? `${employeeMatch[1]} (Est.)` : "Unknown (Not public)";

        // G. Status
        const lowerSnippets = cleanSnippets.toLowerCase();
        let status = "Active";
        if (lowerSnippets.includes('liquidation') || lowerSnippets.includes('liquidated')) status = 'Liquidated';
        if (lowerSnippets.includes('deregistered') || lowerSnippets.includes('final deregistration')) status = 'Deregistered';
        if (lowerSnippets.includes('business rescue')) status = 'Business Rescue';

        // Best Source Link (The "Link regards to the business")
        const sourceLink = items[0]?.link || "";
        const sourceHost = sourceLink.startsWith('http') ? new URL(sourceLink).hostname : "Google Search";

        // Construct the profile manually
        const aiResponse = {
            name: input,
            identifier: identifier,
            industry: industry,
            status: status,
            address: addressHint,
            registrationDate: identifier !== "Not found in web index" ? identifier.substring(0, 4) : "Unknown",
            directors: directors,
            employees: employees,
            operations: operations,
            globalRole: "National Entity",
            summary: `Automated web profile generated from verified sources.`,
            source: `Web Index (${sourceHost})`,
            website: sourceLink, // Passed to frontend
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
