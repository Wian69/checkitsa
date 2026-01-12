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
        // 1. DIRECTED SOURCE INTELLIGENCE (Targeted Search)
        // --------------------------------------------------------------------------------

        console.log(`[Intelligence] Directed Search for: ${input}`);

        // Vector A: DIRECTORY AUTHORITY (The "Truth" Source)
        // We explicitly search authoritative databases that put Reg No in the Title.
        // b2bhint.com, sa-companies.com, localpros.co.za often have strict data.
        const queryRegistry = `site:b2bhint.com OR site:sa-companies.com OR site:easyinfo.co.za "${input}"`;

        // Vector B: CORPORATE PROFILE (The "Rich" Source)
        // Generic search for qualitative data (Employees, CEO, Founded)
        const queryProfile = `"${input}" ("Founded" OR "CEO" OR "Employees" OR "Headquarters" OR "Registration Number") -site:b2bhint.com`;

        const fetchSearch = async (q) => {
            const url = `https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(q)}&num=5`;
            const res = await fetch(url);
            const data = await res.json();
            return data.items || [];
        };

        const [itemsRegistry, itemsProfile] = await Promise.all([
            fetchSearch(queryRegistry),
            fetchSearch(queryProfile)
        ]);

        // Merge Results: Registry first (for ID), then Profile (for richness)
        const allItems = [...itemsRegistry, ...itemsProfile];

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
        // 2. SMART PARSER v7 (Source-Weighted)
        // --------------------------------------------------------------------------------

        let identifier = "Not found in web index";
        const regNumRegex = /\b(\d{4})\/\d{6}\/\d{2}\b/;

        // A. Registration Number Extraction
        // STRATEGY: Trust the Registry Vector (B2BHint) implicitly if it matches the name.

        let registryMatch = null;

        // 1. Check Registry Items first (High Trust)
        for (const item of itemsRegistry) {
            if (item.title.toLowerCase().includes(input.toLowerCase())) {
                const match = item.title.match(regNumRegex) || item.snippet.match(regNumRegex);
                if (match) {
                    const year = parseInt(match[1], 10);
                    if (year > 1900 && year <= new Date().getFullYear()) {
                        registryMatch = match[0];
                        break; // Stop at first valid registry match
                    }
                }
            }
        }

        // 2. If no registry match, fallback to Tiered Search on Profile items
        if (registryMatch) {
            identifier = registryMatch;
        } else {
            // Fallback Logic from v6
            let tier1Match = null;
            let tier2Match = null;

            for (const item of itemsProfile) {
                const match = item.snippet.match(regNumRegex);
                if (match) {
                    const year = parseInt(match[1], 10);
                    if (year > 1900 && year <= new Date().getFullYear()) {
                        if (item.title.toLowerCase().startsWith(input.toLowerCase())) tier1Match = match[0];
                        else if (item.title.toLowerCase().includes(input.toLowerCase())) tier2Match = match[0];
                    }
                }
            }
            if (tier1Match) identifier = tier1Match;
            else if (tier2Match) identifier = tier2Match;
            else {
                // Last Resort
                for (const item of itemsProfile) {
                    const match = item.snippet.match(regNumRegex);
                    if (match) { identifier = match[0]; break; }
                }
            }
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

        // C. Operations
        const bestDescItem = itemsProfile.find(i =>
            /(?:part of|subsidiary of|owned by|group|holding)/i.test(i.snippet) ||
            /is a|specializes|provides|manufacturer|supplier|distributor|solutions|services/i.test(i.snippet)
        );
        const operations = bestDescItem ? bestDescItem.snippet : (allItems[0]?.snippet || "Business listing found in global index.");

        // D. Address / Headquarters / Global Role
        let addressHint = "See web results below";
        let globalRole = "National Entity";

        if (lowerSnippets.includes('global') || lowerSnippets.includes('international') || lowerSnippets.includes('multinational') || lowerSnippets.includes('across africa')) {
            globalRole = "Multinational Enterprise";
        }

        const hqRegex = /(?:Headquarters|Head Office|Based|Located)[:\s]+in\s+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)/i;
        const hqMatch = cleanSnippets.match(hqRegex);

        if (hqMatch) {
            addressHint = `${hqMatch[1]} (Headquarters)`; // e.g. "Headquarters in Cape Town"
        } else {
            // Look for street address pattern in Profile items first
            const addressMatches = itemsProfile.filter(i =>
                /\d+\s+[A-Za-z0-9]+\s+(Street|St|Road|Rd|Ave|Avenue|Box|Crescent|Way|Drive|Lane|Park)/i.test(i.snippet)
            );
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
        // If we found a date in text, use it. Else use Reg Year.
        let foundedDate = foundedMatch ? foundedMatch[1] : "Unknown";
        if (foundedDate === "Unknown" && identifier !== "Not found in web index") {
            foundedDate = identifier.substring(0, 4);
        }

        // H. Status
        let status = "Active";
        if (lowerSnippets.includes('liquidation') || lowerSnippets.includes('liquidated')) status = 'Liquidated';
        if (lowerSnippets.includes('deregistered') || lowerSnippets.includes('final deregistration')) status = 'Deregistered';
        if (lowerSnippets.includes('business rescue')) status = 'Business Rescue';

        // Best Source Link (Prefer Official or Registry)
        // If we used a Registry Match, point to that for verification.
        const sourceLink = registryMatch ? (itemsRegistry.find(i => i.title.includes(registryMatch))?.link || itemsProfile[0]?.link) : (itemsProfile[0]?.link || "");
        const sourceHost = sourceLink.startsWith('http') ? new URL(sourceLink).hostname : "Google Search";

        const aiResponse = {
            name: input,
            identifier: identifier,
            industry: industry,
            status: status,
            address: addressHint,
            registrationDate: foundedDate,
            directors: directors,
            employees: employees,
            operations: operations,
            globalRole: globalRole,
            summary: `Automated web profile generated from authoritative sources.`,
            source: `Web Index (${sourceHost})`,
            website: sourceLink,
            icon: status === 'Active' ? '🏢' : '⚠️',
            details: `Synthesized from ${allItems.length} public web endpoints (Targeted Vectors).`
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
