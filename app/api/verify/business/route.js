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
        const cseKey = process.env.GOOGLE_CSE_API_KEY
        const cx = process.env.GOOGLE_CSE_CX

        if (!cseKey || !cx) {
            return NextResponse.json({
                valid: false,
                data: {
                    status: 'Config Error',
                    message: 'Search services are not configured.',
                    details: 'GOOGLE_CSE_API_KEY or CX is missing in Cloudflare dashboard.'
                }
            })
        }

        console.log(`[Verify] Google Search for: ${input}`)

        // 1. Fetch from Google Search
        const query = `"${input}" South Africa business registration OR linkedin OR contact`
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(query)}`)
        const data = await res.json()

        if (!data.items || data.items.length === 0) {
            return NextResponse.json({
                valid: false,
                data: {
                    name: input,
                    identifier: 'Not Found',
                    status: 'Unknown',
                    message: `❓ No digital footprint found for "${input}" in South Africa.`,
                    source: 'Google Search Registry Check',
                    details: 'Try searching for the official registered name or registration number.'
                }
            })
        }

        // 2. Extract Data from Snippets
        const bestMatch = data.items[0]
        const snippets = data.items.map(i => i.snippet).join(' ').toLowerCase()
        const links = data.items.slice(0, 3).map(i => i.link)

        // Basic Heuristics for "Status"
        let status = 'Record Found'
        let icon = '✅'

        if (snippets.includes('deregistered') || snippets.includes('final liquidated')) {
            status = 'Deregistered / Liquidated'
            icon = '❌'
        } else if (snippets.includes('scam') || snippets.includes('fraud') || snippets.includes('alert')) {
            status = 'Caution: Suspicious'
            icon = '⚠️'
        }

        // Extract potential registration number (basic regex for SA Reg Nos: YYYY/NNNNNN/NN)
        const regMatch = snippets.match(/\d{4}\/\d{6}\/\d{2}/)
        const identifier = regMatch ? regMatch[0] : 'Found via Web'

        return NextResponse.json({
            valid: true,
            data: {
                name: bestMatch.title.split('-')[0].split('|')[0].trim(),
                identifier: identifier,
                status: status,
                message: `${icon} Google Summary: ${bestMatch.snippet}`,
                source: 'Google verified search results',
                details: `Authoritative Links:\n${links.map(l => `• ${new URL(l).hostname}`).join('\n')}`
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
