import { NextResponse } from 'next/server'
// import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

// Initialize Gemini
// We init this lazily inside the handler to ensure env var is picked up if hot-reloaded
// const getGenModel = (apiKey) => {
//     const genAI = new GoogleGenerativeAI(apiKey)
//     return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
// }

export async function POST(request) {
    try {
        const { input } = await request.json()
        // 1. Fetch from OpenCorporates Global Registry (ZA Jurisdiction)
        let openCorporatesData = null;
        try {
            const ocRes = await fetch(`https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(input)}&jurisdiction_code=za`)
            const ocJson = await ocRes.json()
            if (ocJson?.results?.total_count > 0) {
                openCorporatesData = ocJson.results.companies[0].company;
            }
        } catch (ocErr) {
            console.error('[Verify] OpenCorporates Error:', ocErr.message);
        }

        if (!openCorporatesData) {
            return NextResponse.json({
                valid: false,
                data: {
                    name: input,
                    identifier: 'Not Found',
                    status: 'Unknown',
                    message: `❓ No record for "${input}" found in the OpenCorporates South African Registry.`,
                    source: 'OpenCorporates Global Registry (za)',
                    details: 'Try searching for the official registered name or exact registration number.'
                }
            })
        }

        let businessData = {
            name: openCorporatesData.name,
            identifier: openCorporatesData.company_number,
            status: openCorporatesData.current_status || 'Active',
            summary: `Verified via OpenCorporates South African Registry.`,
            icon: '✅'
        }

        // 2. Intelligence Layer: Use Gemini to refine data from OpenCorporates
        const geminiApiKey = process.env.GEMINI_API_KEY
        if (geminiApiKey && geminiApiKey !== 'undefined') {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai')
                const genAI = new GoogleGenerativeAI(geminiApiKey.trim())
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                }, { apiVersion: 'v1' })

                const prompt = `
                Analyze this OpenCorporates registry data for a company in South Africa:
                ${JSON.stringify(openCorporatesData)}

                Provide a professional structured verification report in JSON format.
                Required JSON structure:
                {
                    "name": "Official Registered Company Name",
                    "identifier": "Registration No",
                    "status": "In Business" | "Deregistered" | "Liquidated" | "Unknown",
                    "summary": "Full professional summary of legitimacy and data found in the registry."
                }
                `
                const result = await model.generateContent(prompt)
                const text = result.response.text().trim()

                let aiResponse;
                try {
                    aiResponse = JSON.parse(text);
                } catch (jsonErr) {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) aiResponse = JSON.parse(jsonMatch[0]);
                }

                if (aiResponse) {
                    businessData.name = aiResponse.name || businessData.name
                    businessData.identifier = aiResponse.identifier || businessData.identifier
                    businessData.status = aiResponse.status || businessData.status
                    businessData.summary = aiResponse.summary || businessData.summary
                }

                const statusLower = businessData.status.toLowerCase();
                if (statusLower.includes('suspicious') || statusLower.includes('caution')) businessData.icon = '⚠️'
                else if (statusLower.includes('deregistered') || statusLower.includes('liquidated')) businessData.icon = '❌'
                else if (statusLower.includes('active') || statusLower.includes('business')) businessData.icon = '✅'

            } catch (aiErr) {
                console.error('[Verify] Gemini Summarization failed:', aiErr.message)
            }
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: businessData.name,
                identifier: businessData.identifier,
                status: businessData.status,
                message: `${businessData.icon} ${businessData.summary}`,
                source: 'OpenCorporates Global Registry (za)',
                details: `Authoritative Link: https://opencorporates.com/companies/za/${businessData.identifier}`
            }
        })

    } catch (e) {
        console.error('[Verify] Business Search Error:', e)
        return NextResponse.json({
            valid: false,
            data: {
                status: 'Error',
                message: 'Unable to perform business search.',
                details: e.message
            }
        })
    }
}
