import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { input, email } = await request.json()
        const env = getRequestContext()?.env || {}

        // 0. Permission & Quota Check
        if (!email) {
            return NextResponse.json({ valid: false, data: { status: 'Unauthorized', message: 'Please sign in.' } }, { status: 401 })
        }

        // Define Limits (Monthly Quotas)
        const TIER_LIMITS = {
            'free': 0,       // Strictly blocked for now (upsell)
            'pro': 50,       // Standard
            'premium': 50,   // Legacy support / Fallback
            'elite': 500,    // Power User
            'enterprise': 10000, // High Volume
            'ultimate': 10000,   // Admin
            'custom': 0      // Uses custom_limit column
        };

        let userTier = 'free';

        // DB Usage Check
        if (env.DB) {
            try {
                const user = await env.DB.prepare("SELECT tier, searches, custom_limit FROM users WHERE email = ?").bind(email).first();
                if (user) {
                    userTier = user.tier || 'free';
                    const used = user.searches || 0;
                    // Use custom limit if set (override), otherwise tier limit
                    const limit = (user.custom_limit > 0) ? user.custom_limit : (TIER_LIMITS[userTier] || 0);

                    if (used >= limit) {
                        return NextResponse.json({
                            valid: false,
                            data: {
                                status: 'Quota Exceeded',
                                message: `You have used ${used}/${limit} searches. Please upgrade or renew your subscription.`
                            }
                        }, { status: 403 });
                    }
                    console.log(`[Verify] User: ${email} | Tier: ${userTier} | Usage: ${used}/${limit}`);
                }
            } catch (e) {
                console.warn("[Verify] DB Check Failed:", e);
                // Fail open? Or closed? Commercial product should fail closed usually, but for reliability lets log and proceed if critical DB error (unless strictly enforcing).
                // "Bulletproof" implies strictly enforcing. Proceeding with caution.
            }
        }

        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY
        const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

        if (!serperKey) {
            return NextResponse.json({ valid: false, data: { status: 'Config Error', message: 'Serper API Key missing.' } })
        }

        // COMMERCIAL VERIFICATION ENGINE ("THE HUNTER")

        // STAGE 1: IDENTITY SEARCH
        // Goal: Find the official domain and basic Knowledge Graph data
        const qIdentity = `${input} South Africa`;
        console.log(`[Verify] Stage 1: Identity Search -> "${qIdentity}"`);

        const resIdentity = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
            body: JSON.stringify({ q: qIdentity, gl: "za" })
        });

        const dataIdentity = await resIdentity.json();

        // Detect Official Domain
        let officialDomain = null;
        if (dataIdentity.organic && dataIdentity.organic.length > 0) {
            try {
                // heuristic: first result is usually the official site for a specific brand search
                const urlObj = new URL(dataIdentity.organic[0].link);
                const domain = urlObj.hostname.replace('www.', '');
                // Filter out common social/directory sites if they appear first (rare but possible)
                const blacklist = ['facebook.com', 'linkedin.com', 'hellopeter.com', 'b2bhint.com'];
                if (!blacklist.some(b => domain.includes(b))) {
                    officialDomain = domain;
                }
            } catch (e) { console.warn("Domain parse error", e); }
        }

        let secondarySnippets = [];
        let sourceMode = "UNKNOWN";

        // STAGE 2: BRANCHING LOGIC
        if (officialDomain) {
            console.log(`[Verify] Domain Found: ${officialDomain} -> Activating HUNTER Protocol`);
            sourceMode = "OFFICIAL_WEB";

            // Hunter Queries: Force Google to read the specific pages we care about
            const qLeadership = `site:${officialDomain} "directors" OR "management" OR "leadership" OR "our team" OR "founders"`;
            const qCompliance = `site:${officialDomain} "VAT registration" OR "registration number" OR "contact"`;

            const [resLead, resComp] = await Promise.all([
                fetch("https://google.serper.dev/search", {
                    method: "POST",
                    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                    body: JSON.stringify({ q: qLeadership, gl: "za" })
                }),
                fetch("https://google.serper.dev/search", {
                    method: "POST",
                    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                    body: JSON.stringify({ q: qCompliance, gl: "za" })
                })
            ]);

            const dataLead = await resLead.json();
            const dataComp = await resComp.json();

            secondarySnippets = [
                ...(dataLead.organic || []).map(r => ({ ...r, type: "LEADERSHIP_PAGE" })),
                ...(dataComp.organic || []).map(r => ({ ...r, type: "COMPLIANCE_PAGE" }))
            ];

        } else {
            console.log(`[Verify] No Official Domain -> Activating DIRECTORY FALLBACK`);
            sourceMode = "DIRECTORY_FALLBACK";

            const qDir = `site:b2bhint.com OR site:sa-companies.com "${input}" directors vat`;

            const resDir = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: qDir, gl: "za" })
            });
            const dataDir = await resDir.json();

            secondarySnippets = (dataDir.organic || []).map(r => ({ ...r, type: "DIRECTORY_ENTRY" }));
        }

        // 3. Merged Context Construction
        const context = JSON.stringify({
            MODE: sourceMode,
            OFFICIAL_DOMAIN: officialDomain,
            knowledgeGraph: dataIdentity.knowledgeGraph,
            peopleAlsoAsk: dataIdentity.peopleAlsoAsk,

            primarySnippets: (dataIdentity.organic || []).slice(0, 3), // General Google Results
            hunterSnippets: secondarySnippets // Targeted Deep Results
        });

        // 3. Robust AI Extraction with Failover
        let extracted = {
            identifier: "Not Found",
            address: "Not Found",
            phone: "Not Found",
            website: officialDomain ? `https://${officialDomain}` : null, // Auto-fill if found
            summary: null,
            tags: [],
            vatNumber: "Not Listed",
            directors: [],
            rating: null,
            reviews: null
        };

        if (geminiKey) {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const models = ["gemini-1.5-flash", "gemini-pro"];

            for (const m of models) {
                try {
                    console.log(`[Verify] Attempting ${m}...`);
                    const model = genAI.getGenerativeModel({ model: m });
                    const prompt = `
                    You are a Commercial Verification Engine. Extract EXACT VALIDATED details for "${input}".
                    
                    SOURCE MODE: ${sourceMode} (Trust Level: ${sourceMode === "OFFICIAL_WEB" ? "HIGH" : "MEDIUM"})
                    DATA: ${context}
                    
                    CRITICAL INSTRUCTIONS:
                    1. WEBSITE: Use the OFFICIAL_DOMAIN if available.
                    2. LEADERSHIP: Look specifically in 'hunterSnippets' (type: LEADERSHIP_PAGE) for Directors/ExCo.
                    3. COMPLIANCE: Look specifically in 'hunterSnippets' (type: COMPLIANCE_PAGE) for VAT/Reg Numbers.
                    4. IDENTIFIER: CIPC Registration Number (YYYY/NNNNNN/NN).
                    5. DIRECTORS: Extract ALL names of Directors/Founders. Do not summarize.
                    6. ADDRESS: Full physical address.
                    7. RATING: Google Review Rating (from knowledgeGraph).
                    
                    Return JSON ONLY: 
                    { 
                        "identifier": "...", 
                        "address": "...", 
                        "phone": "...",
                        "website": "...",
                        "summary": "...",
                        "tags": ["Tag1", "Tag2"],
                        "vatNumber": "...",
                        "directors": ["Name 1", "Name 2"],
                        "rating": 4.5,
                        "reviews": 100
                    }
                    Use "Not Listed" if strictly not found.
                    `;

                    const result = await model.generateContent(prompt);
                    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    const aiData = JSON.parse(text);

                    // Merge AI data but respect our "Official Domain" hard-lock
                    extracted = { ...extracted, ...aiData };
                    if (officialDomain) extracted.website = `https://${officialDomain}`;

                    console.log(`[Verify] Success with ${m}`);
                    break;
                } catch (e) {
                    console.warn(`[Verify] ${m} failed:`, e.message);
                }
            }
        }

        // 4. Regex Fallback (Safety Net)
        const strContext = JSON.stringify(context);

        if (extracted.identifier === "Not Found" || extracted.identifier === "Not Listed") {
            const regMatch = strContext.match(/\b(19|20)\d{2}\/\d{6}\/\d{2}\b/);
            if (regMatch) extracted.identifier = regMatch[0];

            const addrMatch = strContext.match(/Address:\s*(.*?)(?=\s*(?:B-BBEE|Scorecard|Phone|VAT|$))/i);
            if (addrMatch && addrMatch[1]) {
                let cleanAddr = addrMatch[1].trim().replace(/\.$/, '');
                if (cleanAddr.length > 10) extracted.address = cleanAddr;
            }

            const phoneMatch = strContext.match(/(?:\+27|0)[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/);
            const landline = strContext.match(/(?:\+27|0)(11|21|10|12|31|41|51)[0-9]{7}/);
            if (landline) extracted.phone = landline[0];
            else if (phoneMatch) extracted.phone = phoneMatch[0];

            const founderMatchBroad = strContext.match(/(?:founders|owners|directors|leadership)(?:'s)?(?:.*?)(?:are|:|include|by)\s+([A-Za-z\s&,\.]+?)(?:\.|,|\s(?:and|are)|$)/i);
            if (founderMatchBroad && founderMatchBroad[1]) {
                const founders = founderMatchBroad[1].split(/,| and |&/).map(s => s.trim()).filter(s => s.length > 3 && !s.includes('http'));
                const current = new Set(extracted.directors || []);
                founders.forEach(f => current.add(f));
                extracted.directors = Array.from(current);
            }

            const vatMatch = strContext.match(/\b4\d{9}\b/);
            if (vatMatch) extracted.vatNumber = vatMatch[0];

            // If still no website, check primary snippets
            if (!extracted.website) {
                const webSnippet = (dataIdentity.organic || []).slice(0, 1)[0];
                if (webSnippet) {
                    extracted.website = webSnippet.link;
                    extracted.summary = webSnippet.title;
                }
            }
        }

        // Direct Knowledge Graph Injection
        if (dataIdentity.knowledgeGraph) {
            if (dataIdentity.knowledgeGraph.rating) extracted.rating = dataIdentity.knowledgeGraph.rating;
            if (dataIdentity.knowledgeGraph.ratingCount) extracted.reviews = dataIdentity.knowledgeGraph.ratingCount;
        }

        // DB: Increment Usage
        if (env.DB && email) {
            try {
                await env.DB.prepare("UPDATE users SET searches = searches + 1 WHERE email = ?").bind(email).run();
                console.log(`[Verify] Incremented search count for ${email}`);
            } catch (e) {
                console.error("[Verify] Failed to increment usage:", e);
            }
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: input,
                identifier: extracted.identifier || "Not Listed",
                address: extracted.address || "Not Listed",
                phone: extracted.phone || "Not Listed",
                website: extracted.website || null,
                summary: extracted.summary || null,
                tags: extracted.tags || [],
                vatNumber: extracted.vatNumber || "Not Listed",
                directors: extracted.directors || []
            }
        });

    } catch (e) {
        console.error('[Verify] Error:', e)
        return NextResponse.json({ valid: false, data: { status: 'Error', message: e.message } })
    }
}
