import { NextResponse } from 'next/server'
import dns from 'dns'
import util from 'util'
import whois from 'whois-json'

const resolveMx = util.promisify(dns.resolveMx)
const resolveTxt = util.promisify(dns.resolveTxt)

export async function POST(request) {
    const body = await request.json()
    const { sender, subject, content } = body

    let riskScore = 0
    let details = []

    // 1. Parse Sender
    let cleanSender = sender
    if (sender.includes('<')) {
        cleanSender = sender.match(/<([^>]+)>/)[1]
    }
    const senderDomain = cleanSender.split('@')[1] || ''

    // 2. Domain Age (Whois)
    let domainAge = 'Unknown'
    try {
        const w = await whois(senderDomain)
        const cDate = w.creationDate || w.created || w['Creation Date']
        if (cDate) {
            const created = new Date(cDate)
            const now = new Date()
            const days = Math.ceil(Math.abs(now - created) / (1000 * 60 * 60 * 24))
            domainAge = days > 365 ? `${(days / 365).toFixed(1)} years` : `${days} days`

            if (days < 30) {
                riskScore += 30
                details.push(`Domain is extremely new (${days} days old). High scam risk.`)
            }
        }
    } catch (e) { }

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
