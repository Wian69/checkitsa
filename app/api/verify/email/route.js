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

    // Shared Analysis Vars
    const fullText = (sender + ' ' + subject + ' ' + content).toLowerCase()
    const targets = ['fnb', 'sars', 'standard bank', 'absa', 'capitec']
    const free = ['gmail.com', 'yahoo.com', 'outlook.com']
    const isFree = free.includes(senderDomain)

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

    // --- Calculate Domain Age Early ---
    if (createdDate) {
        const now = new Date()
        const days = Math.ceil(Math.abs(now - createdDate) / (1000 * 60 * 60 * 24))
        domainAge = days > 365 ? `${(days / 365).toFixed(1)} years` : `${days} days`

        if (days < 30) {
            riskScore += 30
            details.push(`Domain is extremely new (${days} days old). High scam risk.`)
        }
    }

    // C: Serper Intelligence (Domain Age & Footprint)
    const env = process.env
    const serperKey = env.SERPER_API_KEY

    // Domain Age Fallback via Serper check
    if (!createdDate && serperKey) {
        try {
            const domainRes = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: `site:${senderDomain}`, num: 1 })
            })
            // Analysis skipped for speed, just rely on RDAP mostly.
        } catch (e) { }
    }

    // --- Email Address Footprint Analysis (Serper) ---
    if (serperKey) {
        try {
            const emailQuery = `"${cleanSender}"`
            const res = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: emailQuery, num: 10 })
            })
            const data = await res.json()
            const items = data.organic || []

            if (items.length > 0) {
                // Analyze where it was found
                const sites = items.map(i => i.link).join(' ')
                const snippets = items.map(i => (i.title + ' ' + i.snippet).toLowerCase()).join(' ')

                if (sites.includes('linkedin.com')) {
                    emailFirstSeen = 'Verified Professional (LinkedIn)'
                    riskScore -= 10 // Trust signal
                } else if (sites.includes(senderDomain)) {
                    emailFirstSeen = 'Verified on Company Website'
                    riskScore -= 10
                } else {
                    emailFirstSeen = 'Found in public web records'
                }

                if (snippets.includes('scam') || snippets.includes('fraud') || snippets.includes('fake')) {
                    riskScore += 50
                    details.push('Email address explicitly named in online scam reports.')
                    emailFirstSeen = '⚠️ FLAGGED IN SCAM REPORTS'
                }
            } else {
                // If Domain is old but email is new -> Likely Enterprise Private Email
                if (domainAge.includes('years')) {
                    emailFirstSeen = 'Private Enterprise Email (Unlisted)'
                } else {
                    emailFirstSeen = 'No digital footprint found'
                }
            }
        } catch (e) {
            console.error('Serper Email Check Error', e)
        }
    }

    // --- Advanced Serper Content Analysis (Reputation & Scripts) ---
    if (serperKey) {
        try {
            // 1. Reputation Check: Is the domain known for scams?
            if (senderDomain && !isFree) {
                const repRes = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: `"${senderDomain}" scam reviews complaints`, num: 3, gl: 'za' })
                })
                const repData = await repRes.json()
                const repItems = repData.organic || []
                const combinedRep = repItems.map(i => (i.title + ' ' + i.snippet).toLowerCase()).join(' ')

                if (combinedRep.includes('scam') || combinedRep.includes('fraud') || combinedRep.includes('phishing') || combinedRep.includes('fake')) {
                    riskScore += 40
                    details.push(`High Alert: Online complaints found regarding ${senderDomain}.`)
                }
            }

            // 2. Script Fingerprinting: Search for the exact Subject line
            // Scammers often reuse subjects like "URGENT PAYMENT OUTSTANDING"
            if (subject && subject.length > 10) {
                const scriptRes = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: `"${subject}" scam script`, num: 3 })
                })
                const scriptData = await scriptRes.json()
                if (scriptData.organic && scriptData.organic.length > 0) {
                    // If we find exact matches on sites like 'scamwarners', it's bad.
                    const foundSites = scriptData.organic.map(i => i.link).join(' ')
                    if (foundSites.includes('scam') || foundSites.includes('reddit') || foundSites.includes('consumer')) {
                        riskScore += 30
                        details.push('Subject line matches known scam templates online.')
                    }
                }
            }

        } catch (e) {
            console.error('Serper Advanced Check Error', e)
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

    // --- Layer 6: Gemini AI Semantic Intent Analysis ---
    let aiInsight = null
    if (env.GEMINI_API_KEY) {
        try {
            const { GoogleGenerativeAI } = require("@google/generative-ai")
            const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

            const prompt = `
                Analyze this email for scam/phishing indicators. 
                Sender: ${sender}
                Subject: ${subject}
                Body Snapshot: ${content.substring(0, 1500)}

                Focus on psychological triggers: Are they asking for OTPs, bank logins, or using extreme urgency?
                Return ONLY a JSON object with:
                {
                  "intent": "Scam/Phishing/Safe/Marketing",
                  "risk_points": 0 to 60,
                  "reasoning": "brief description",
                  "triggers": ["list of flags"]
                }
            `
            const result = await model.generateContent(prompt)
            const responseText = result.response.text().replace(/```json|```/g, "").trim()
            const aiData = JSON.parse(responseText)

            aiInsight = aiData
            riskScore += aiData.risk_points
            if (aiData.risk_points > 20) {
                details.push(`AI Analysis: ${aiData.reasoning}`)
            }
        } catch (e) {
            console.error('Gemini Analysis Failed', e)
        }
    }

    riskScore = Math.min(riskScore, 100)

    return NextResponse.json({
        status: riskScore > 60 ? 'Dangerous' : (riskScore > 30 ? 'Suspicious' : 'Safe'),
        score: riskScore,
        domain_age: domainAge,
        registrar: registrar,
        email_first_seen: emailFirstSeen,
        flags: details,
        ai_analysis: aiInsight,
        message: riskScore > 60 ? '⛔ DANGEROUS' : 'Analysis Complete.'
    })
}
