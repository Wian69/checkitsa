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
            phone: "Not Found"
        };

        if (geminiKey) {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            Extract ONLY the following 3 fields for the company "${input}" from the data below.
            
            DATA:
            ${context}

            RULES:
            1. Registration Number: Look for format YYYY/NNNNNN/NN.
            2. Address: Look for the Head Office / Physical Address.
            3. Phone: Look for the primary contact number.
            
            Return ONLY JSON: { "identifier": "...", "address": "...", "phone": "..." }
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            try { extracted = JSON.parse(text); } catch (e) { }
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: input,
                identifier: extracted.identifier || "Not Listed",
                address: extracted.address || "Not Listed",
                phone: extracted.phone || "Not Listed"
            }
        });

    } catch (e) {
        console.error('[Verify] Error:', e)
        return NextResponse.json({ valid: false, data: { status: 'Error', message: e.message } })
    }
}
