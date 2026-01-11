import { NextResponse } from 'next/server'

export const runtime = 'edge'

async function resolveMx(domain) {
    try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
            headers: { 'accept': 'application/dns-json' }
        })
        const data = await res.json()
        return data.Answer || []
    } catch (e) {
        return []
    }
}

export async function POST(request) {
    const body = await request.json()
    const { sender, subject, content } = body

    let riskScore = 0
    let details = []

    // 1. Parse Sender
    let cleanSender = sender
    if (sender.includes('<')) {
        const match = sender.match(/<([^>]+)>/)
        if (match) cleanSender = match[1]
    }
    const senderDomain = cleanSender.split('@')[1] || ''

    // 2. Advanced Domain & Email Age Analysis
    let domainAge = 'Unknown'
    let registrar = 'Unknown'
    let createdDate = null
    let emailFirstSeen = 'Unknown'

    // --- Domain Age Strategy (Ported from Website Scanner) ---
    // A: RDAP
    try {
        const rdapRes = await fetch(`https://rdap.org/domain/${senderDomain}`, { signal: AbortSignal.timeout(3000) })
        if (rdapRes.ok) {
            const rdap = await rdapRes.json()
            const events = rdap.events || []
            const regEvent = events.find(e => e.eventAction === 'registration' || e.eventAction === 'last changed')
            if (regEvent) createdDate = new Date(regEvent.eventDate)

            const entities = rdap.entities || []
            const registrarEntity = entities.find(e => e.roles && e.roles.includes('registrar'))
            if (registrarEntity && registrarEntity.vcardArray) {
                const vcard = registrarEntity.vcardArray[1]
                const fn = vcard.find(item => item[0] === 'fn')
                if (fn) registrar = fn[3]
            }
        }
    } catch (e) { }

    // B: Creation.date Fallback
    if (!createdDate) {
        try {
            const creationRes = await fetch(`https://creation.date/api/${senderDomain}`, { signal: AbortSignal.timeout(3000) })
            if (creationRes.ok) {
                const creationData = await creationRes.json()
                if (creationData.created) createdDate = new Date(creationData.created)
            }
        } catch (e) { }
    }

    const cseKey = process.env.GOOGLE_CSE_API_KEY
    const cx = process.env.GOOGLE_CSE_CX

    // C: Google Intelligence (Domain Age Last Resort)
    if (!createdDate && cseKey && cx) {
        try {
            const whoisQuery = `"${senderDomain}" whois registration date`
            const whoisRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(whoisQuery)}`)
            const whoisData = await whoisRes.json()
            if (whoisData.items && whoisData.items.length > 0) {
                const snippet = (whoisData.items[0].snippet + whoisData.items[0].title).toLowerCase()
                const yearMatch = snippet.match(/(199\d|20[0-2]\d)/)
                if (yearMatch) {
                    createdDate = new Date(`${yearMatch[0]}-01-01`)
                    if (registrar === 'Unknown') registrar = 'Found via Web Intelligence'
                }
            }
        } catch (e) { }
    }

    // --- Email Address "Creation Date" Proxy (First Seen) ---
    if (cseKey && cx) {
        try {
            // Search for the exact email address to find first index or reputation
            const emailQuery = `"${cleanSender}"`
            const emailRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(emailQuery)}`)
            const emailData = await emailRes.json()

            if (emailData.items && emailData.items.length > 0) {
                emailFirstSeen = 'Found in public records'
                // If found on scam lists, auto-flag
                const combined = emailData.items.map(i => i.title + ' ' + i.snippet).join(' ').toLowerCase()
                if (combined.includes('scam') || combined.includes('fraud') || combined.includes('fake')) {
                    riskScore += 40
                    details.push('Email address associated with fraud reports online.')
                }
            } else {
                emailFirstSeen = 'No public digital footprint (New or Private)'
            }
        } catch (e) { }
    }

    if (createdDate) {
        const now = new Date()
        const days = Math.ceil(Math.abs(now - createdDate) / (1000 * 60 * 60 * 24))
        domainAge = days > 365 ? `${(days / 365).toFixed(1)} years` : `${days} days`

        if (days < 30) {
            riskScore += 30
            details.push(`Domain is extremely new (${days} days old). High scam risk.`)
        }
    }

    // 3. DNS Checks (MX/TXT)
    let dnsStatus = 'Unknown'
    try {
        const mx = await resolveMx(senderDomain)
        if (!mx || mx.length === 0) {
            riskScore += 50
            details.push(`Invalid Domain: ${senderDomain} cannot receive email (No MX).`)
        } else {
            dnsStatus = 'Valid'
        }
    } catch (e) {
        riskScore += 80
        details.push(`Non-Existent Domain: ${senderDomain}.`)
    }

    // 4. Impersonation & Content (Re-using logic)
    const fullText = (sender + ' ' + subject + ' ' + content).toLowerCase()
    const targets = ['fnb', 'sars', 'standard bank', 'absa', 'capitec']
    const free = ['gmail.com', 'yahoo.com', 'outlook.com']
    const isFree = free.includes(senderDomain)

    targets.forEach(t => {
        if (fullText.includes(t)) {
            if (isFree || (!senderDomain.includes(t.replace(' ', '')) && !senderDomain.includes('co.za'))) {
                riskScore += 40
                details.push(`Possible impersonation of ${t.toUpperCase()}.`)
            }
        }
    })

    const urgency = ['urgent', 'immediate', 'suspend', 'lock']
    if (urgency.some(u => fullText.includes(u))) {
        riskScore += 20
        details.push('Urgent language detected.')
    }

    riskScore = Math.min(riskScore, 100)

    return NextResponse.json({
        status: riskScore > 60 ? 'Dangerous' : (riskScore > 30 ? 'Suspicious' : 'Safe'),
        score: riskScore,
        domain_age: domainAge,
        registrar: registrar,
        email_first_seen: emailFirstSeen,
        flags: details,
        message: riskScore > 60 ? '⛔ DANGEROUS' : 'Analysis Complete.'
    })
}
