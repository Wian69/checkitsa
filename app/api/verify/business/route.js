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

        // 1. Single Serper Call (No vectors, no crawling)
        // We ask specifically for the "Imprint" or "Contact" data to find the Reg No.
        const q = `${input} South Africa registration number address phone contact`
        console.log(`[SimpleVerify] Searching: ${q}`)

        const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
            body: JSON.stringify({ q, gl: "za" })
        });

        const serperData = await res.json();

        // 2. Simple Extraction
        const context = JSON.stringify({
            knowledgeGraph: serperData.knowledgeGraph,
            snippets: serperData.organic?.slice(0, 5).map(r => ({ title: r.title, snippet: r.snippet, link: r.link })),
            places: serperData.places?.slice(0, 1).map(p => ({ address: p.address, title: p.title }))
        });

        let extracted = {
            identifier: "Not Found",
            address: "Not Found",
            phone: "Not Found",
            website: null,
            summary: null,
            tags: []
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
                    2. Address: Head Office Address.
                    3. Phone: Primary Contact Number.
                    4. Website: Official Homepage URL (ignore generic directories).
                    5. Summary: 1-2 sentence description of what they do.
                    6. Tags: Extract trust signals like "B-BBEE Level X", "ISO 9001", "SABS", etc.
                    
                    Return JSON ONLY: 
                    { 
                        "identifier": "...", 
                        "address": "...", 
                        "phone": "...",
                        "website": "...",
                        "summary": "...",
                        "tags": ["Tag1", "Tag2"]
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
        if (extracted.identifier === "Not Found" || extracted.identifier === "Not Listed") {
            console.log('[Verify] AI Fallback -> Regex');
            const strContext = JSON.stringify(context);

            const regMatch = strContext.match(/\b(19|20)\d{2}\/\d{6}\/\d{2}\b/);
            if (regMatch) extracted.identifier = regMatch[0];

            const phoneMatch = strContext.match(/(?:\+27|0)[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/);
            const landline = strContext.match(/(?:\+27|0)(11|21|10|12|31|41|51)[0-9]{7}/);
            // Prioritize landline for business
            if (landline) extracted.phone = landline[0];
            else if (phoneMatch) extracted.phone = phoneMatch[0];

            // Simple website/summary extraction from organic links
            if (serperData.organic && serperData.organic.length > 0) {
                extracted.website = serperData.organic[0].link;
                extracted.summary = serperData.organic[0].snippet;
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
                tags: extracted.tags || []
            }
        });

    } catch (e) {
        console.error('[Verify] Error:', e)
        return NextResponse.json({ valid: false, data: { status: 'Error', message: e.message } })
    }
}
