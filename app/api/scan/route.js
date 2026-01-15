import { NextResponse } from 'next/server'

export const runtime = 'edge'


const timeout = (ms) => new Promise(res => setTimeout(res, ms))

// Common URL shortener domains
const SHORTENER_DOMAINS = [
    'bit.ly', 'bitly.cx', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
    'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'short.link', 'rebrand.ly',
    'cutt.ly', 'tiny.cc', 'rb.gy', 'shorturl.at', 'clck.ru'
]

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({})) // Safe parse
        const { input } = body

        if (!input) return NextResponse.json({ message: 'Missing input' }, { status: 400 })

        if (!input) return NextResponse.json({ message: 'Missing input' }, { status: 400 })

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
            // SSL Check: If we can connect via HTTPS, it has SSL.
            if (finalUrl.startsWith('https://')) {
                const sslCheck = await fetch(finalUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) }).catch(() => null)
                if (sslCheck && sslCheck.ok) policies.ssl = true
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
        // Default SSL to true if Protocol is HTTPS (verified above), else false
        let policies = { privacy: false, terms: false, ssl: finalUrl.startsWith('https') }

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

        // White-list Own Domain & Trusted Giants
        const TRUSTED = ['checkitsa.co.za', 'google.com', 'microsoft.com', 'apple.com', 'fnb.co.za', 'standardbank.co.za', 'absa.co.za', 'capitec.co.za', 'nedbank.co.za']
        if (TRUSTED.some(t => domain.includes(t))) {
            return NextResponse.json({
                safe: true,
                riskScore: 0,
                verdict: 'Verified Safe',
                details: {
                    url: finalUrl,
                    domain: domain,
                    summary: 'Verified Trusted Entity',
                    domain_age: 'Verified',
                    registrar: 'Verified Identity',
                    policies: { privacy: true, terms: true, ssl: true },
                    reputation_flags: [],
                    is_shortened: false
                },
                message: '✅ Verified Safe: Trusted Organization.'
            })
        }

        const serperKey = process.env.SERPER_API_KEY

        // Try Direct Fetch for basic metadata (Title/Desc) - keep this for summary
        try {
            const pageRes = await fetch(finalUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(4000)
            })
            if (pageRes.ok) {
                const text = (await pageRes.text()).toLowerCase()
                // Basic HTML check (optional fallback)
                if (text.includes('privacy policy')) policies.privacy = true
                if (text.includes('terms of service') || text.includes('terms and conditions')) policies.terms = true

                // Login form check
                if (text.includes('type="password"')) score += 5

                const titleMatch = text.match(/<title>([^<]+)<\/title>/i)
                if (titleMatch) siteSummary = titleMatch[1]
            }
        } catch (e) { }

        // Superior Serper Policy Check
        if (serperKey && (!policies.privacy || !policies.terms)) {
            try {
                // Check for Privacy Policy
                const privRes = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: `site:${domain} "privacy policy"`, num: 1 })
                })
                const privData = await privRes.json()
                if (privData.organic && privData.organic.length > 0) policies.privacy = true

                // Check for Terms
                const termsRes = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: `site:${domain} "terms"`, num: 1 })
                })
                const termsData = await termsRes.json()
                if (termsData.organic && termsData.organic.length > 0) policies.terms = true

            } catch (serpErr) { console.error(serpErr) }
        }

        // 3. Domain Age & Registrar Strategy (RDAP + Fallback)
        let domainAge = 'Unknown'
        let registrar = 'Unknown'
        let createdDate = null

        // Strategy A: RDAP (Standard Protocol)
        try {
            const rdapRes = await fetch(`https://rdap.org/domain/${rootDomain}`, { signal: AbortSignal.timeout(3000) })
            if (rdapRes.ok) {
                const rdap = await rdapRes.json()

                // Extract Registration Date
                const events = rdap.events || []
                const regEvent = events.find(e => e.eventAction === 'registration' || e.eventAction === 'last changed')
                if (regEvent) createdDate = new Date(regEvent.eventDate)

                // Extract Registrar
                const entities = rdap.entities || []
                const registrarEntity = entities.find(e => e.roles && e.roles.includes('registrar'))
                if (registrarEntity && registrarEntity.vcardArray) {
                    const vcard = registrarEntity.vcardArray[1]
                    const fn = vcard.find(item => item[0] === 'fn')
                    if (fn) registrar = fn[3]
                }
            }
        } catch (e) { console.log('RDAP lookup failed', e) }

        // Strategy B: creation.date (Fallback)
        if (!createdDate) {
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
        }

        // Strategy C: Serper Intelligence (Last Resort)
        if (!createdDate && serperKey) {
            try {
                const whoisRes = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: `"${domain}" whois registration date`, num: 1 })
                })
                const whoisData = await whoisRes.json()
                if (whoisData.organic && whoisData.organic.length > 0) {
                    const txt = (whoisData.organic[0].snippet + whoisData.organic[0].title).toLowerCase()
                    const yearMatch = txt.match(/(199\d|20[0-2]\d)/)
                    if (yearMatch) {
                        createdDate = new Date(`${yearMatch[0]}-01-01`)
                        if (registrar === 'Unknown') registrar = 'Verified via Web Web (Serper)'
                    }
                }
            } catch (e) { }
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
            // Unknown age = suspicious, BUT if Google found results, it's likely established.
            if (googleResults.length > 0) {
                score += 5 // Minimal penalty if indexed
            } else {
                score += 20 // High penalty if unknown AND not on Google
            }
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
    } catch (fatalError) {
        console.error('Fatal Scan Error:', fatalError)
        return NextResponse.json({
            error: 'Server Error',
            message: fatalError.message || 'Unknown error occurred'
        }, { status: 500 })
    }
}
