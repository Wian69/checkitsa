import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, phone, name } = await req.json()
        
        if (!email && !phone) {
            return NextResponse.json({ matches: [] })
        }

        // Build a highly targeted search query to find their exact details
        // We use exact match quotes for email and phone.
        const queryParts = []
        if (email) queryParts.push(`"${email}"`)
        if (phone) queryParts.push(`"${phone}"`)
        
        // We don't just search the name by itself because "John Doe" will return 1,000,000 false positives.
        // But if they provided a name, we can do: ("email" OR "phone")
        const query = queryParts.join(' OR ')

        // Fetch DuckDuckGo HTML version (bypasses JS challenges)
        const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        })
        
        if (!res.ok) {
            throw new Error('Failed to fetch from search engine')
        }

        const html = await res.text()
        
        // Extract all result URLs
        const domains = []
        // Regex to extract the href attribute from DDG result links
        const regex = /<a class="result__url" href="[^"]+">\s*([^<]+)\s*<\/a>/g
        let match
        
        while ((match = regex.exec(html)) !== null) {
            let domainStr = match[1].trim()
            // Clean up bold tags that DDG sometimes injects
            domainStr = domainStr.replace(/<\/?b>/g, '')
            // Extract just the domain part if it has a path
            const cleanDomain = domainStr.split('/')[0].toLowerCase()
            
            // Filter out common false positives and our own site
            const ignoreList = ['duckduckgo.com', 'google.com', 'checkitsa.co.za', 'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com']
            if (cleanDomain && !ignoreList.some(ignore => cleanDomain.includes(ignore))) {
                domains.push(cleanDomain)
            }
        }
        
        // Deduplicate
        const uniqueDomains = [...new Set(domains)]
        
        // Map them to objects so the frontend can display them nicely
        const matches = uniqueDomains.map((domain, index) => ({
            name: domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0],
            url: domain,
            risk: index < 3 ? 'HIGH RISK' : 'MEDIUM RISK' // The first few results on Google/DDG are usually the most relevant/dangerous
        }))

        return NextResponse.json({ matches })
    } catch (e) {
        console.error('Deep Scan Error:', e)
        // Fallback gracefully on error instead of breaking the app
        return NextResponse.json({ matches: [] }, { status: 500 })
    }
}
