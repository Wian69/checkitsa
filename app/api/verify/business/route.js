import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { input, email } = await request.json()
        const env = getRequestContext()?.env || {}

        // 0. Permission Check
        if (!email) {
            return NextResponse.json({ valid: false, data: { status: 'Unauthorized', message: 'Please sign in.' } }, { status: 401 })
        }

        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY
        const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

        if (!serperKey) {
            return NextResponse.json({ valid: false, data: { status: 'Config Error', message: 'Serper API Key missing.' } })
        }

        // 1. Dual-Search Strategy (Entity + Details)
        // Query A: "Entity Focus" -> Triggers Knowledge Graph, Ratings, Founders (PAA)
        // Query B: "Deep Details" -> Triggers VAT, Registration Numbers, Addresses (Organic Snippets)

        const qEntity = `${input} South Africa`;
        const qDetails = `${input} South Africa registration number address phone contact`;

        console.log(`[Verify] Parallel Search: Entity="${qEntity}" | Details="${qDetails}"`);

        const [resEntity, resDetails] = await Promise.all([
            fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: qEntity, gl: "za" })
            }),
            fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: qDetails, gl: "za" })
            })
        ]);

        const dataEntity = await resEntity.json();
        const dataDetails = await resDetails.json();

        // 2. Merged Context Construction
        const context = JSON.stringify({
            knowledgeGraph: dataEntity.knowledgeGraph, // From Entity Search (Stars, Logo, etc)
            peopleAlsoAsk: dataEntity.peopleAlsoAsk,   // From Entity Search (Founders)

            // Merge snippets: Prioritize "Detailed" snippets for Reg/VAT, but keep Entity ones for Bio/Context
            snippets: [
                ...(dataDetails.organic || []).slice(0, 6), // Deep details
                ...(dataEntity.organic || []).slice(0, 3)   // General context
            ].map(r => ({ title: r.title, snippet: r.snippet, link: r.link })),

            places: dataEntity.places || dataDetails.places // Fallback to either
        });

        let extracted = {
            identifier: "Not Found",
            address: "Not Found",
            phone: "Not Found",
            website: null,
            summary: null,
            tags: [],
            vatNumber: "Not Listed",
            directors: [],
            rating: null,
            reviews: null
        };

        // 3. Robust AI Extraction with Failover
        if (geminiKey) {
            const genAI = new GoogleGenerativeAI(geminiKey);
            // Try simpler/older models first if Flash fails (404 issues)
            const models = ["gemini-1.5-flash", "gemini-pro"];

            for (const m of models) {
                try {
                    console.log(`[Verify] Attempting ${m}...`);
                    const model = genAI.getGenerativeModel({ model: m });
                    const prompt = `
                    Extract fields for "${input}" from data below.
                    DATA: ${context}
                    
                    RULES:
                    1. Identifier: CIPC Registration Number (YYYY/NNNNNN/NN).
                    2. Address: Head Office Address. (If not explicitly found, check for area codes like 011/021/etc in snippets and infer location e.g. "Johannesburg Area").
                    3. Phone: Primary Contact Number.
                    4. Website: Official Homepage URL.
                    5. Summary: 1-2 sentence professional description of OPERATIONS.
                    6. Tags: Extract verify signals like "B-BBEE Level X", "ISO 9001", "SABS".
                    7. VAT: South African VAT Number (10 digits, usually starts with 4).
                    8. Directors: List names of Directors, Founders, or Owners. Check 'peopleAlsoAsk' specifcally for 'Who is owner/founder'.
                    9. Rating: Google Review Rating (e.g. 4.2).
                    10. Reviews: Number of Google Reviews (e.g. 29).
                    
                    Return JSON ONLY: 
                    { 
                        "identifier": "YYYY/NNNNNN/NN", 
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
                    Use "Not Listed" if missing.
                    `;

                    const result = await model.generateContent(prompt);
                    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    extracted = JSON.parse(text);
                    console.log(`[Verify] Success with ${m}`);
                    break;
                } catch (e) {
                    console.warn(`[Verify] ${m} failed:`, e.message);
                }
            }
        }

        // 4. Regex Fallback (Safety Net)
        const strContext = JSON.stringify(context); // Compute once

        if (extracted.identifier === "Not Found" || extracted.identifier === "Not Listed") {
            console.log('[Verify] AI Fallback -> Regex');

            const regMatch = strContext.match(/\b(19|20)\d{2}\/\d{6}\/\d{2}\b/);
            if (regMatch) extracted.identifier = regMatch[0];

            // Regex for Address (Greedy capture until known stop words like B-BBEE or Scorecard or End of string)
            const addrMatch = strContext.match(/Address:\s*(.*?)(?=\s*(?:B-BBEE|Scorecard|Phone|VAT|$))/i);
            if (addrMatch && addrMatch[1]) {
                let cleanAddr = addrMatch[1].trim().replace(/\.$/, ''); // Remove trailing dot
                if (cleanAddr.length > 10) extracted.address = cleanAddr;
            }

            const phoneMatch = strContext.match(/(?:\+27|0)[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/);
            const landline = strContext.match(/(?:\+27|0)(11|21|10|12|31|41|51)[0-9]{7}/);

            // Prioritize landline for business, then mobile
            if (landline) extracted.phone = landline[0];
            else if (phoneMatch) extracted.phone = phoneMatch[0];

            // Manual Founder Extraction (Override)
            // Look for "founders ... are" pattern specifically in PAA string
            const founderMatchStrict = strContext.match(/founders\s+([A-Za-z\s&]+)(?:,| are| and)/i);
            if (founderMatchStrict && founderMatchStrict[1]) {
                console.log('[Verify] Found founders via strict regex:', founderMatchStrict[1]);
                const founders = founderMatchStrict[1].split(/,| and /).map(s => s.trim()).filter(s => s.length > 3);
                if (founders.length > 0) {
                    // Add to directors if not already present
                    const current = new Set(extracted.directors || []);
                    founders.forEach(f => current.add(f));
                    extracted.directors = Array.from(current);
                }
            }

            // Regex for VAT
            const vatMatch = strContext.match(/\b4\d{9}\b/);
            if (vatMatch) extracted.vatNumber = vatMatch[0];

            // Regex for Directors (Legal Representatives)
            const dirMatch = strContext.match(/legal representative\(s\) of .*?[:\s]+([A-Za-z\s,\.]+)/i);
            if (dirMatch && dirMatch[1]) {
                // Simple split cleanup
                extracted.directors = dirMatch[1].split(/,| and /).map(s => s.trim()).filter(s => s.length > 3 && s.length < 30);
            }

            if (extracted.website === "Not Listed" || !extracted.website) {
                // Try to find website in merged snippets
                const webSnippet = (dataEntity.organic || []).find(r => r.link) || (dataDetails.organic || []).find(r => r.link);
                if (webSnippet) {
                    extracted.website = webSnippet.link;
                    extracted.summary = webSnippet.title;
                }
            }
        }

        // 5. Final Director Cleanup & Rating Injection from KnowledgeGraph
        // Sometimes AI misses it even if successful, so check Regex again if empty
        if ((!extracted.directors || extracted.directors.length === 0 || extracted.directors[0] === "Not Listed")) {
            const dirBackup = strContext.match(/legal representative\(s\) of .*?[:\s]+([^.]+)/i);
            if (dirBackup && dirBackup[1]) {
                console.log('[Verify] Injecting missed directors from Regex');
                extracted.directors = dirBackup[1].split(/,| and /).map(s => s.trim()).filter(s => s.length > 3 && s.length < 30);
            }
            // Backup Regex for Founders
            const founderMatch = strContext.match(/(?:founders|owners|founded by) (?:are|is)?\s*([A-Za-z\s&,]+)/i);
            if (founderMatch && founderMatch[1]) {
                extracted.directors = founderMatch[1].split(/,| and /).map(s => s.trim()).filter(s => s.length > 3 && s.length < 30);
            }
        }

        // Direct Knowledge Graph Injection for perfect accuracy
        if (dataEntity.knowledgeGraph) {
            if (dataEntity.knowledgeGraph.rating) extracted.rating = dataEntity.knowledgeGraph.rating;
            if (dataEntity.knowledgeGraph.ratingCount) extracted.reviews = dataEntity.knowledgeGraph.ratingCount;
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
