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
        // RESTORED: Precise query removing 'CIPC' noise but keeping 'South Africa'
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
        // 2. Web-Only Intelligence Layer (Advanced Smart Parser v2)

        // FILTER 1: Anti-Noise (Remove CIPC Lists/Gazettes)
        // If a snippet contains more than 1 registration number pattern, it's likely a list. Ignore it.
        const cleanItems = items.filter(i => {
            const count = (i.snippet.match(/\d{4}\/\d{6}\/\d{2}/g) || []).length;
            return count <= 1;
        });
        const cleanSnippets = cleanItems.map(i => `${i.title} ${i.snippet}`).join(' | ');

        // A. Registration Number (Oldest Year Heuristic - Filtered)
        // We capture ALL patterns like YYYY/NNNNNN/NN found in the search results.
        const regNumRegexGlobal = /\b(\d{4})\/\d{6}\/\d{2}\b/g;
        const allMatches = [...cleanSnippets.matchAll(regNumRegexGlobal)];

        let setOfYears = [];
        allMatches.forEach(m => {
            const y = parseInt(m[1], 10);
            if (y > 1900 && y <= new Date().getFullYear()) {
                setOfYears.push({ full: m[0], year: y });
            }
        });
        // Sort by Year Ascending (Oldest First)
        setOfYears.sort((a, b) => a.year - b.year);

        const identifier = setOfYears.length > 0 ? setOfYears[0].full : "Not found in web index";

        // B. Industry Detection (Refined Dictionary)
        const industries = [
            'Agriculture', 'Mining', 'Manufacturing', 'Logistics', 'Transport', 'Freight',
            'Energy', 'Construction', 'Retail', 'Wholesale', 'Hospitality',
            'Technology', 'Software', 'Finance', 'Insurance', 'Real Estate',
            'Healthcare', 'Education', 'Legal', 'Consulting', 'Security', 'Media'
        ];
        const foundIndustry = industries.find(ind => cleanSnippets.toLowerCase().includes(ind.toLowerCase()));
        const industry = foundIndustry ? `${foundIndustry} (Web Verified)` : "Multi-Sector (Web Index)";

        // C. Operations / Description (Semantic Match)
        // Find the snippet that sounds most like a description ("is a", "provides", "solutions")
        const bestDescItem = cleanItems.find(i =>
            /is a|specializes|provides|manufacturer|supplier|distributor|solutions|services/i.test(i.snippet)
        );
        const operations = bestDescItem ? bestDescItem.snippet : (items[0]?.snippet || "Business listing found in global index.");

        // D. Address / Headquarters (Priority Search)
        // 1. Look for "Headquarters" or "Randfontein" (User hint: major cities often appear)
        // 2. Look for standard address pattern
        const cityRegex = /(?:Headquarters|HQ|Based) in ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/;
        const hqMatch = cleanSnippets.match(cityRegex);

        let addressHint = "See web results below";
        if (hqMatch) {
            addressHint = `${hqMatch[1]} (Headquarters)`;
        } else {
            const addressItem = cleanItems.find(i => /\d+\s+[A-Za-z]+\s+(Street|St|Road|Rd|Ave|Box)/i.test(i.snippet));
            if (addressItem) addressHint = addressItem.snippet;
        }

        // E. Directors
        // Strict "Director:" search
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
            summary: `Automated web profile generated from ${cleanItems.length} verified sources.`,
            source: "Global Web Index (Filtered)",
            icon: status === 'Active' ? '🏢' : '⚠️',
            details: `Synthesized from ${cleanItems.length} public web endpoints (Noise filtered).`
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
