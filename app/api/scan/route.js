import { NextResponse } from 'next/server'


const timeout = (ms) => new Promise(res => setTimeout(res, ms))

// Common URL shortener domains
const SHORTENER_DOMAINS = [
    'bit.ly', 'bitly.cx', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
    'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'short.link', 'rebrand.ly',
    'cutt.ly', 'tiny.cc', 'rb.gy', 'shorturl.at', 'clck.ru'
]

export async function POST(request) {
    const body = await request.json()
    const { input } = body
    const sbKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY
    const cseKey = process.env.GOOGLE_CSE_API_KEY
    const cx = process.env.GOOGLE_CSE_CX

    // 1. URL Resolution & Shortener Detection
    let finalUrl = input
    let isShortened = false
    let domain = input
    let redirectHistory = []

    try {
        if (!finalUrl.startsWith('http')) {
            finalUrl = `https://${finalUrl}`
        }
        domain = new URL(finalUrl).hostname

        // Recursive expansion (max 3 hops)
        let currentUrl = finalUrl
        for (let i = 0; i < 3; i++) {
            const isShort = SHORTENER_DOMAINS.some(s => domain.includes(s))
            if (isShort) isShortened = true

            try {
                const expandRes = await fetch(currentUrl, {
                    method: 'HEAD',
                    redirect: 'manual',
                    signal: AbortSignal.timeout(5000)
                })

                const location = expandRes.headers.get('location')
                if (location) {
                    const nextUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href
                    redirectHistory.push(nextUrl)
                    currentUrl = nextUrl
                    domain = new URL(currentUrl).hostname
                } else {
                    break
                }
            } catch (e) {
                break
            }
        }
        finalUrl = currentUrl
    } catch (e) {
        domain = input.split('/')[0]
    }

    // Root Domain Extraction for WHOIS (e.g. pay.thecourierguy.pro -> thecourierguy.pro)
    const getRootDomain = (hostname) => {
        const parts = hostname.split('.')
        if (parts.length > 2) {
            // Basic logic: take last two or three if it's a known ccTLD combo (like .co.za)
            const last = parts[parts.length - 1]
            const secondLast = parts[parts.length - 2]
            if (['za', 'uk', 'au'].includes(last) && ['co', 'org', 'ac', 'gov', 'edu'].includes(secondLast)) {
                return parts.slice(-3).join('.')
            }
            return parts.slice(-2).join('.')
        }
        return hostname
    }
    const rootDomain = getRootDomain(domain)

    // 2. Data Gathering Strategy: Parallel Fetch + Google Search
    let siteSummary = 'Summary unavailable.'
    let policies = { privacy: false, terms: false }

    // Perform Google Search FIRST to get snippet (most reliable)
    let googleResults = []
    try {
        if (cseKey && cx) {
            const query = `site:${domain} OR "${domain}"`
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(query)}`
            const res = await fetch(searchUrl)
            const data = await res.json()
            if (data.items && data.items.length > 0) {
                googleResults = data.items
                siteSummary = data.items[0].snippet
            }
        }
    } catch (e) { console.log('Google CSE error:', e) }

    // Try Direct Fetch for specifically looking for Policy Links
    try {
        const pageRes = await fetch(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(4000)
        })
        if (pageRes.ok) {
            const text = (await pageRes.text()).toLowerCase()
            if (text.includes('privacy policy') || text.includes('privacy-policy')) policies.privacy = true
            if (text.includes('terms') || text.includes('terms of service')) policies.terms = true

            // Refine summary if metadata found
            const metaDesc = text.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
            if (metaDesc) siteSummary = metaDesc[1]
        }
    } catch (e) {
        // Fetch failed (Blocked). Fallback to searching Google Results for policy presence
        const combinedSnippets = googleResults.map(i => i.title + ' ' + i.snippet).join(' ').toLowerCase()
        if (combinedSnippets.includes('privacy')) policies.privacy = true
        if (combinedSnippets.includes('terms')) policies.terms = true
    }

    // 3. Domain Age & Registrar (creation.date fallback)
    let domainAge = 'Unknown'
    let registrar = 'Unknown'
    let createdDate = null

    // Fallback: Use creation.date API
    try {
        const creationRes = await fetch(`https://creation.date/api/${rootDomain}`, {
            signal: AbortSignal.timeout(3000)
        })
        if (creationRes.ok) {
            const creationData = await creationRes.json()
            if (creationData.created) {
                createdDate = new Date(creationData.created)
            }
        }
    } catch (e) {
        console.log('Fallback domain age failed:', e)
    }

    if (createdDate) {
        const now = new Date()
        const diffDays = Math.ceil(Math.abs(now - createdDate) / (1000 * 60 * 60 * 24))
        domainAge = diffDays > 365 ? `${(diffDays / 365).toFixed(1)} years` : `${diffDays} days`
    }

    // 4. Improved Risk Scoring
    let score = 0

    // URL Shortener = HIGH RISK (often used for phishing)
    if (isShortened) score += 50

    // No privacy policy = suspicious
    if (!policies.privacy) score += 15
    if (!policies.terms) score += 10

    // Very new domain = HIGH RISK
    if (createdDate) {
        const daysOld = (new Date() - createdDate) / (1000 * 60 * 60 * 24)
        if (daysOld < 7) score += 40  // Less than a week old
        else if (daysOld < 30) score += 30  // Less than a month
        else if (daysOld < 90) score += 15  // Less than 3 months
    } else {
        // Unknown age = suspicious
        score += 20
    }

    // Reputation Check (Re-using Google Results to save calls)
    let reputationFlags = []
    googleResults.forEach(item => {
        const txt = (item.title + item.snippet).toLowerCase()
        if (txt.includes('scam') || txt.includes('fraud') || txt.includes('phishing')) {
            reputationFlags.push(`Negative report: ${item.title}`)
            score += 25
        }
    })

    score = Math.min(score, 100)

    return NextResponse.json({
        safe: score < 30,
        riskScore: score,
        verdict: score > 60 ? 'Dangerous' : (score > 40 ? 'Suspicious' : 'Safe'),
        details: {
            url: finalUrl,
            original_url: isShortened ? input : null,
            domain: domain,
            summary: siteSummary,
            domain_age: domainAge,
            registrar: registrar,
            policies: policies,
            reputation_flags: reputationFlags,
            is_shortened: isShortened
        },
        message: score > 60 ? '⛔ High Risk Detected.' : (score > 40 ? '⚠️ Proceed with Caution.' : '✅ Analysis Complete.')
    })
}
