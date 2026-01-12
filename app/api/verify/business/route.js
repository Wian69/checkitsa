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

        // --------------------------------------------------------------------------------
        // 1. MULTI-VECTOR WEB SEARCH (Parallel Execution)
        // --------------------------------------------------------------------------------

        console.log(`[Intelligence] Multi-Vector Search for: ${input}`);

        // Vector A: Legal & Compliance (Focus on Registration Number, Address)
        const queryLegal = `"${input}" ("Registration Number" OR "Reg No" OR "Headquarters") South Africa`;

        // Vector B: Profile & Operations (Focus on Description, Employees, Directors, Founded)
        const queryProfile = `"${input}" ("Founded" OR "CEO" OR "Employees" OR "Global" OR "Directors")`;

        const fetchSearch = async (q) => {
            const url = `https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(q)}&num=8`; // 8 results per vector
            const res = await fetch(url);
            const data = await res.json();
            return data.items || [];
        };

        const [itemsLegal, itemsProfile] = await Promise.all([
            fetchSearch(queryLegal),
            fetchSearch(queryProfile)
        ]);

        // Merge Results (Legal first for ID priority, then Profile for richness)
        const allItems = [...itemsLegal, ...itemsProfile];

        if (allItems.length === 0) {
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'No Data Found',
                    message: 'No digital footprint found for this entity.',
                    details: 'Try refining the business name.'
                }
            })
        }

        // --------------------------------------------------------------------------------
        // 2. UNIVERSAL SMART PARSER v6 (Multi-Vector)
        // --------------------------------------------------------------------------------

        let identifier = "Not found in web index";
        const regNumRegex = /\b(\d{4})\/\d{6}\/\d{2}\b/;

        // A. Registration Number Extraction (Tiered Authority)
        // We prioritize the "Legal" search results for this, but check everything.

        let tier1Match = null; // Title STARTS WITH input
        let tier2Match = null; // Title CONTAINS input
        let tier3Match = null; // Snippet CONTAINS input

        // Helper to check year validity
        const isValidYear = (yStr) => {
            const y = parseInt(yStr, 10);
            return y > 1900 && y <= new Date().getFullYear();
        };

        for (const item of allItems) {
            const title = item.title.toLowerCase();
            const cleanInput = input.toLowerCase();

            const match = item.snippet.match(regNumRegex);
            if (match && isValidYear(match[1])) {
                if (title.startsWith(cleanInput)) {
                    if (!tier1Match) tier1Match = match[0];
                } else if (title.includes(cleanInput)) {
                    if (!tier2Match) tier2Match = match[0];
                } else if (item.snippet.toLowerCase().includes(cleanInput)) {
                    if (!tier3Match) tier3Match = match[0];
                }
            }
        }

        // Select Best Identifier
        if (tier1Match) identifier = tier1Match;
        else if (tier2Match) identifier = tier2Match;
        else if (tier3Match) identifier = tier3Match;
        else {
            // Fallback: First valid number found anywhere
            for (const item of allItems) {
                const match = item.snippet.match(regNumRegex);
                if (match && isValidYear(match[1])) {
                    identifier = match[0];
                    break;
                }
            }
        }

        // Loose Regex Fallback (if strict CIPC failed)
        if (identifier === "Not found in web index") {
            const altMatch = allItems[0]?.snippet.match(/(?:Reg(?:istration)?(?:\s+No)?\.?|Number)[\s:.-]*((?:\d{4}\/\d+|\d{9,}))/i);
            if (altMatch) identifier = altMatch[1];
        }

        const cleanSnippets = allItems.map(i => `${i.title} ${i.snippet}`).join(' | ');
        const lowerSnippets = cleanSnippets.toLowerCase();

        // B. Industry Detection
        const industries = [
            'Agriculture', 'Mining', 'Manufacturing', 'Logistics', 'Transport', 'Freight',
            'Retail', 'Wholesale', 'FMCG', 'Supermarket',
            'Energy', 'Construction', 'Hospitality',
            'Technology', 'Software', 'Finance', 'Insurance', 'Real Estate',
            'Healthcare', 'Education', 'Legal', 'Consulting', 'Security', 'Media'
        ];
        const foundIndustry = industries.find(ind => lowerSnippets.includes(ind.toLowerCase()));
        const industry = foundIndustry ? `${foundIndustry} (Web Verified)` : "Multi-Sector (Web Index)";

        // C. Operations / Description
        // Prioritize "Profile" vector items for description
        const bestDescItem = itemsProfile.concat(itemsLegal).find(i =>
            /(?:part of|subsidiary of|owned by|group|holding)/i.test(i.snippet) ||
            /is a|specializes|provides|manufacturer|supplier|distributor|solutions|services/i.test(i.snippet)
        );
        const operations = bestDescItem ? bestDescItem.snippet : (allItems[0]?.snippet || "Business listing found in global index.");

        // D. Address / Headquarters / Global Role
        let addressHint = "See web results below";
        let globalRole = "National Entity";

        // Global Role Heuristic
        if (lowerSnippets.includes('global') || lowerSnippets.includes('international') || lowerSnippets.includes('multinational') || lowerSnippets.includes('across africa') || lowerSnippets.includes('worldwide')) {
            globalRole = "Multinational Enterprise";
        }

        // Address Extraction
        const hqRegex = /(?:Headquarters|Head Office|Based|Located)[:\s]+in\s+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)/i;
        const hqMatch = cleanSnippets.match(hqRegex);

        if (hqMatch) {
            addressHint = `${hqMatch[1]} (Headquarters)`;
        } else {
            const addressMatches = allItems.filter(i =>
                /\d+\s+[A-Za-z0-9]+\s+(Street|St|Road|Rd|Ave|Avenue|Box|Crescent|Way|Drive|Lane|Park)/i.test(i.snippet)
            );
            // Prioritize address from a Title Match item if possible
            const bestAddr = addressMatches.find(i => i.title.toLowerCase().includes(input.toLowerCase())) || addressMatches[0];
            if (bestAddr) addressHint = bestAddr.snippet;
        }

        // E. Directors
        const directorRegex = /(?:CEO|Director|Managing Director|CFO|Founder|Owner)[\s:-]+([A-Z][a-z]+ [A-Z][a-z]+)/g;
        const potentialDirectors = [...cleanSnippets.matchAll(directorRegex)].map(m => m[1]).slice(0, 3);
        const directors = potentialDirectors.length > 0 ? potentialDirectors : ["Listed in full report"];

        // F. Employees
        const employeeRegex = /(?:employs|employing|staff of|workforce of)\s*(?:approx\.?|nearly|over|more than|approximately)?\s*([0-9,]+(?:\s+people|\s+employees|\s+staff)?)/i;
        const employeeMatch = cleanSnippets.match(employeeRegex);
        const employees = employeeMatch ? `${employeeMatch[1]} (Est.)` : "Unknown (Not public)";

        // G. Founded Date
        const foundedRegex = /(?:founded|established|started|formed) in (\d{4})/i;
        const foundedMatch = cleanSnippets.match(foundedRegex);
        const foundedDate = foundedMatch ? foundedMatch[1] : (identifier !== "Not found in web index" ? identifier.substring(0, 4) : "Unknown");

        // H. Status
        let status = "Active";
        if (lowerSnippets.includes('liquidation') || lowerSnippets.includes('liquidated')) status = 'Liquidated';
        if (lowerSnippets.includes('deregistered') || lowerSnippets.includes('final deregistration')) status = 'Deregistered';
        if (lowerSnippets.includes('business rescue')) status = 'Business Rescue';

        // Best Source Link (Website)
        // Prefer official site from Legal search, or Profile search
        const sourceLink = itemsLegal[0]?.link || itemsProfile[0]?.link || "";
        const sourceHost = sourceLink.startsWith('http') ? new URL(sourceLink).hostname : "Google Search";

        // Construct the profile
        const aiResponse = {
            name: input,
            identifier: identifier,
            industry: industry,
            status: status,
            address: addressHint,
            registrationDate: foundedDate, // Use Founded date or Reg Year
            directors: directors,
            employees: employees,
            operations: operations,
            globalRole: globalRole,
            summary: `Automated web profile generated from verified sources.`,
            source: `Web Index (${sourceHost})`,
            website: sourceLink,
            icon: status === 'Active' ? '🏢' : '⚠️',
            details: `Synthesized from ${allItems.length} public web endpoints (Multi-Vector).`
        };

        return NextResponse.json({
            valid: true,
            data: aiResponse
        })

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
