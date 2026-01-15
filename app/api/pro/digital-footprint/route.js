import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { query, type } = await req.json() // type: 'person' or 'business'
        const env = getRequestContext().env
        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY

        if (!query) return NextResponse.json({ message: 'Query required' }, { status: 400 })

        // targeted searches
        const targets = [
            `site:linkedin.com "${query}"`,
            `site:facebook.com "${query}"`,
            `site:instagram.com "${query}"`,
            `site:hellopeter.com "${query}"`, // Reputation
            `site:cipc.co.za "${query}"`,    // Business Reg
            `"${query}" scam`,                // Negative check
            `"${query}" fraud`
        ]

        // We can do a single combined search or multiple. 
        // Serper allows batching but standard plan might limit. 
        // Let's do a smart combined search to save credits:
        // Or actually, just searching the name globally + a few site specifics is better.

        const searchQuery = `"${query}" (site:linkedin.com OR site:facebook.com OR site:hellopeter.com OR site:cipc.co.za OR "scam" OR "fraud")`

        const res = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: searchQuery,
                gl: 'za',
                hl: 'en',
                num: 20
            })
        })

        const data = await res.json()
        const results = data.organic || []

        // Analysis
        let footprintScore = 0
        let platformsFound = []
        let negativeSignals = []

        results.forEach(item => {
            const link = item.link.toLowerCase()
            const snippet = (item.snippet || '').toLowerCase()
            const title = (item.title || '').toLowerCase()

            if (link.includes('linkedin.com')) { footprintScore += 20; platformsFound.push('LinkedIn') }
            if (link.includes('facebook.com')) { footprintScore += 10; platformsFound.push('Facebook') }
            if (link.includes('instagram.com')) { footprintScore += 10; platformsFound.push('Instagram') }
            if (link.includes('hellopeter.com')) { footprintScore += 15; platformsFound.push('HelloPeter') }
            if (link.includes('cipc.co.za') || snippet.includes('registration')) { footprintScore += 25; platformsFound.push('CIPC / Business Reg') }

            // Negative Checks
            if (title.includes('scam') || snippet.includes('scam') || title.includes('fraud') || snippet.includes('fraud') || title.includes('beware')) {
                negativeSignals.push({ title: item.title, link: item.link })
                footprintScore -= 50 // Penalty
            }
        })

        platformsFound = [...new Set(platformsFound)] // Unique
        if (footprintScore > 100) footprintScore = 100
        if (footprintScore < 0) footprintScore = 0

        // Determine Status
        let status = 'UNKNOWN'
        if (platformsFound.length >= 2) status = 'VERIFIED_PRESENCE'
        if (negativeSignals.length > 0) status = 'HIGH_RISK'
        if (platformsFound.length === 0 && negativeSignals.length === 0) status = 'GHOST' // No footprint is suspicious for a business

        return NextResponse.json({
            status,
            score: footprintScore,
            platforms: platformsFound,
            negativeSignals,
            results: results.slice(0, 5).map(r => ({ title: r.title, link: r.link, snippet: r.snippet }))
        })

    } catch (error) {
        console.error('Digital Footprint Error:', error)
        return NextResponse.json({ message: 'Error checking footprint' }, { status: 500 })
    }
}
