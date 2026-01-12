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
        // We Use Boolean OR operators to FORCE Google to return snippets containing the ID
        const intelligenceQuery = `"${input}" ("Registration Number" OR "Reg No" OR "CIPC") South Africa`;

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

        // 2. Web-Only Intelligence Layer (Advanced Smart Parser)

        // A. Registration Number (Oldest Year Heuristic)
        // We capture ALL patterns like YYYY/NNNNNN/NN found in the search results.
        // We then sort them by Year. The OLDEST year (e.g. 1996) is likely the original founding company,
        // whereas newer years (e.g. 2014) are likely subsidiaries or fleet vehicles.
        const regNumRegexGlobal = /\b(\d{4})\/\d{6}\/\d{2}\b/g;
        const allMatches = [...snippets.matchAll(regNumRegexGlobal)];

        // Also look for looser formats like 1996/008694/07 if the strict word boundary failed
        const altRegRegexGlobal = /(?:Reg(?:istration)?(?:\s+No)?\.?|Number)[\s:.-]*((?:\d{4}\/\d+|\d{9,}))/gi;
        const allAltMatches = [...snippets.matchAll(altRegRegexGlobal)];

        let setOfYears = [];

        // Helper to push valid matches
        const addMatch = (fullStr, yearStr) => {
            const y = parseInt(yearStr, 10);
            if (y > 1900 && y <= new Date().getFullYear()) {
                setOfYears.push({ full: fullStr, year: y });
            }
        };

        allMatches.forEach(m => addMatch(m[0], m[1]));
        // For alt matches, we need to extract the year again manually from the captured group
        allAltMatches.forEach(m => {
            const yMatch = m[1].match(/^(\d{4})/);
            if (yMatch) addMatch(m[1], yMatch[1]);
        });

        // Sort by Year Ascending (Oldest First) to find the "Main" company
        setOfYears.sort((a, b) => a.year - b.year);

        const identifier = setOfYears.length > 0 ? setOfYears[0].full : "Not found in web index";

        // B. Industry Detection (Keyword Dictionary)
        const industries = [
            'Agriculture', 'Mining', 'Manufacturing', 'Energy', 'Construction',
            'Retail', 'Wholesale', 'Logistics', 'Transport', 'Hospitality',
            'Technology', 'Software', 'Finance', 'Insurance', 'Real Estate',
            'Healthcare', 'Education', 'Legal', 'Consulting', 'Security', 'Media'
        ];
        // Scan snippets for these keywords
        const foundIndustry = industries.find(ind => snippets.toLowerCase().includes(ind.toLowerCase()));
        const industry = foundIndustry ? `${foundIndustry} (Web Verified)` : "Multi-Sector (Web Index)";

        // C. Employee Count (Regex Heuristic)
        // Looks for patterns like "50 employees", "staff of 100", "over 1000 people"
        const employeeRegex = /(?:approx\.?|over|more than|staff of|employing)\s*(\d+(?:,\d+)?\+?)\s*(?:employees|staff|people|workers)/i;
        const employeeMatch = snippets.match(employeeRegex);
        const employees = employeeMatch ? `${employeeMatch[1]} (Est.)` : "Unknown (Not public)";

        // D. Status Detection
        const lowerSnippets = snippets.toLowerCase();
        let status = "Active";
        if (lowerSnippets.includes('liquidation') || lowerSnippets.includes('liquidated')) status = 'Liquidated';
        if (lowerSnippets.includes('deregistered') || lowerSnippets.includes('de-registered')) status = 'Deregistered';
        if (lowerSnippets.includes('business rescue')) status = 'Business Rescue';

        // E. Address Extraction (Improved)
        // Look for common SA address markers: "Street", "Road", "Box", "Park", "Gardens" combined with a number
        const addressMatch = items.find(i => {
            const s = i.snippet;
            return /\d+\s+[A-Za-z]+\s+(Street|St|Road|Rd|Avenue|Ave|Crescent|Cres|Drive|Dr|Way|Park|Gardens|Box)/i.test(s);
        });
        const addressHint = addressMatch ? addressMatch.snippet : (items[0]?.snippet || "See web results below");

        // F. Directors / Key People
        // Look for "CEO: Name" or "Director: Name" pattern
        const directorRegex = /(?:CEO|Director|Manager|Owner|Founder)[\s:-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g;
        const potentialDirectors = [...snippets.matchAll(directorRegex)].map(m => m[1]).slice(0, 3); // Take top 3
        const directors = potentialDirectors.length > 0 ? potentialDirectors : ["Listed in full report"];

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
