import { NextResponse } from 'next/server'

// export const runtime = 'edge'


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

async function getDomainAge(domain) {
    try {
        const res = await fetch(`https://creation.date/api/${encodeURIComponent(domain)}`)
        if (res.ok) {
            const data = await res.json()
            if (data.created) return new Date(data.created)
        }
    } catch (e) { }
    return null
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

    // 2. Domain Age
    let domainAge = 'Unknown'
    const createdDate = await getDomainAge(senderDomain)
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
        flags: details,
        message: riskScore > 60 ? '⛔ DANGEROUS' : 'Analysis Complete.'
    })
}
