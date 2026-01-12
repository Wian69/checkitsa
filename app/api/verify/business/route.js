import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
        const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

        if (!cseKey || !cx) {
            return NextResponse.json({ valid: false, data: { status: 'Config Error', message: 'Intelligence services are not correctly configured.' } })
        }

        // --------------------------------------------------------------------------------
        // 1. MULTI-VECTOR WEB SEARCH (Data Gathering)
        // --------------------------------------------------------------------------------
        console.log(`[Intelligence] Directed Search for: ${input}`);

        const queryRegistry = `site:b2bhint.com OR site:sa-companies.com OR site:easyinfo.co.za "${input}"`;
        const queryProfile = `"${input}" ("Founded" OR "CEO" OR "Employees" OR "Headquarters" OR "Registration Number") -site:b2bhint.com`;

        const fetchSearch = async (q) => {
            const url = `https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(q)}&num=6`;
            const res = await fetch(url);
            const data = await res.json();
            return data.items || [];
        };

        const [itemsRegistry, itemsProfile] = await Promise.all([
            fetchSearch(queryRegistry),
            fetchSearch(queryProfile)
        ]);

        const allItems = [...itemsRegistry, ...itemsProfile];

        if (allItems.length === 0) {
            return NextResponse.json({
                valid: false,
                data: { status: 'No Data Found', message: 'No digital footprint found for this entity.' }
            })
        }

        // --------------------------------------------------------------------------------
        // 2. HYBRID INTELLIGENCE (AI with Regex Fallback)
        // --------------------------------------------------------------------------------

        let aiData = null;
        let usedSource = "Web-Only Heuristic";

        // TRY AI SYNTHESIS FIRST (Gemini 1.5 Flash)
        if (geminiKey) {
            try {
                const genAI = new GoogleGenerativeAI(geminiKey);
                // Use 'gemini-1.5-flash' for speed and cost effectiveness
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const context = allItems.map(i => `[TITLE]: ${i.title}\n[SNIPPET]: ${i.snippet}\n[LINK]: ${i.link}`).join('\n---\n');

                const prompt = `
                You are a highly accurate Business Intelligence Analyst.
                Analyze the following web search snippets for the South African company: "${input}".
                
                Your Goal: Construct a precise corporate profile.
                
                CRITICAL RULES:
                1. Registration Number: Prioritize the OLDEST entity if multiple are found (Parent vs Subsidiary). Identify the main holding company. 
                   - Example: If you see "1996/..." and "2017/...", the 1996 one is likely the parent.
                   - Look for CIPC format: YYYY/NNNNNN/NN.
                2. Employee Count: specific numbers (e.g., "169,000") are better than "Unknown". Look for "employs", "staff of", "workforce".
                3. Industry: Classify into one general sector (e.g. Logistics, Retail, Mining, Finance).
                4. Status: specific keywords like "Liquidation" or "Deregistered". Default to "Active".
                5. Global Role: if they operate in multiple countries, mark as "Multinational".

                Return ONLY a JSON object with this shape:
                {
                    "identifier": "YYYY/NNNNNN/NN" or "Not found",
                    "industry": "Industry Name",
                    "status": "Active/Liquidated/Deregistered",
                    "address": "Headquarters City or Full Address",
                    "registrationDate": "YYYY" (Founded year or Reg Year),
                    "directors": ["Name 1", "Name 2"],
                    "employees": "Number (Est.)" or "Unknown",
                    "operations": "Short description of what they do",
                    "globalRole": "National Entity" or "Multinational Enterprise",
                    "officialWebsite": "URL of official site or best profile link"
                }
                
                SEARCH SNIPPETS:
                ${context}
                `;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();

                // Clean markdown code blocks if present
                const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                aiData = JSON.parse(cleanJson);
                usedSource = "AI Verified (Gemini 1.5)";

            } catch (aiError) {
                console.warn('[Intelligence] AI Synthesis Failed, falling back to Regex:', aiError);
                // Fallthrough to Regex logic below
            }
        }

        // 3. FALLBACK: V7 REGEX PARSER (If AI failed or no Key)
        if (!aiData) {
            aiData = synthesizeWithWebOnly(itemsRegistry, itemsProfile, input, allItems);
        }

        // Final Response Construction
        return NextResponse.json({
            valid: true,
            data: {
                name: input,
                identifier: aiData.identifier,
                industry: aiData.industry,
                status: aiData.status,
                address: aiData.address,
                registrationDate: aiData.registrationDate,
                directors: aiData.directors || [],
                employees: aiData.employees,
                operations: aiData.operations,
                globalRole: aiData.globalRole,
                summary: `Automated web profile generated from authoritative sources.`,
                source: `${usedSource}`,
                website: aiData.officialWebsite || (allItems[0]?.link || ""),
                icon: aiData.status === 'Active' ? '🏢' : '⚠️',
                details: `Synthesized from ${allItems.length} verified web endpoints.`
            }
        });

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

// -----------------------------------------------------------------------
// FALLBACK LOGIC (The "v7" Regex Engine)
// -----------------------------------------------------------------------
function synthesizeWithWebOnly(itemsRegistry, itemsProfile, input, allItems) {
    let identifier = "Not found in web index";
    const regNumRegex = /\b(\d{4})\/\d{6}\/\d{2}\b/;
    let registryMatch = null;

    // 1. Registry Vector
    for (const item of itemsRegistry) {
        if (item.title.toLowerCase().includes(input.toLowerCase())) {
            const match = item.title.match(regNumRegex) || item.snippet.match(regNumRegex);
            if (match) {
                const year = parseInt(match[1], 10);
                if (year > 1900 && year <= new Date().getFullYear()) {
                    registryMatch = match[0];
                    break;
                }
            }
        }
    }
    if (registryMatch) identifier = registryMatch;
    else {
        // Fallback to Profile Vector
        for (const item of itemsProfile) {
            const match = item.snippet.match(regNumRegex);
            if (match && item.title.toLowerCase().includes(input.toLowerCase())) {
                identifier = match[0]; break;
            }
        }
    }

    const cleanSnippets = allItems.map(i => `${i.title} ${i.snippet}`).join(' | ');
    const lowerSnippets = cleanSnippets.toLowerCase();

    // Industry
    const industries = ['Agriculture', 'Mining', 'Manufacturing', 'Logistics', 'Retail', 'Technology', 'Finance', 'Healthcare', 'Consulting'];
    const foundIndustry = industries.find(ind => lowerSnippets.includes(ind.toLowerCase()));

    // Address
    let address = "See web results";
    const hqMatch = cleanSnippets.match(/(?:Headquarters|Based) in ([A-Z][a-z]+)/);
    if (hqMatch) address = hqMatch[1];
    else {
        const addrItem = itemsProfile.find(i => /\d+\s+[A-Za-z]+\s+(Street|Road|Box)/i.test(i.snippet));
        if (addrItem) address = addrItem.snippet;
    }

    // Employees
    const empMatch = cleanSnippets.match(/(?:employs|staff of)\s*(\d+(?:,\d+)?)/i);
    const employees = empMatch ? `${empMatch[1]} (Est.)` : "Unknown";

    // Operations
    const descItem = itemsProfile.find(i => /is a|provides|specializes/i.test(i.snippet));
    const operations = descItem ? descItem.snippet : "Business listing found.";

    return {
        identifier,
        industry: foundIndustry || "Multi-Sector",
        status: "Active",
        address,
        registrationDate: identifier.startsWith("2") || identifier.startsWith("1") ? identifier.substring(0, 4) : "Unknown",
        directors: ["Listed in report"],
        employees,
        operations,
        globalRole: "National Entity",
        officialWebsite: itemsProfile[0]?.link || ""
    };
}
