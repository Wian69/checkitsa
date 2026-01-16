import { NextResponse } from 'next/server'

export const runtime = 'edge'

const FREE_EMAIL_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com'
]

const SCAM_KEYWORDS = [
    'training fee', 'admin fee', 'administration fee', 'uniform fee', 'deposit required',
    'bank account details', 'whatsapp interview', 'no experience needed', 'guaranteed job',
    'easy money', 'work from home agent', 'typing job', 'data entry clerk', 'sms job',
    'fax job', 'western union', 'moneygram', 'crypto', 'bitcoin'
]

async function checkGoogleReputation(companyName) {
    if (!process.env.SERPER_API_KEY) return { score: 0, findings: [] }

    try {
        const query = `"${companyName}" scam reviews south africa`
        const res = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': process.env.SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query, gl: 'za' })
        })
        const data = await res.json()

        const findings = []
        let riskScore = 0

        // Analyze snippets for negative sentiment
        const scamHits = data.organic?.filter(item =>
            item.snippet?.toLowerCase().includes('scam') ||
            item.snippet?.toLowerCase().includes('fraud') ||
            item.snippet?.toLowerCase().includes('fake') ||
            item.title?.toLowerCase().includes('scam')
        ) || []

        if (scamHits.length > 0) {
            riskScore += 60
            findings.push(`Found ${scamHits.length} potential scam reports on Google for "${companyName}".`)
        } else {
            // Check for lack of digital footprint (Ghost Company)
            if (!data.organic || data.organic.length < 3) {
                riskScore += 30
                findings.push(`"${companyName}" has a very low digital footprint. Legitimate companies usually have more search results.`)
            }
        }

        return { score: riskScore, findings }
    } catch (e) {
        console.error("Serper Error:", e)
        return { score: 0, findings: ["Could not perform Google reputation check."] }
    }
}

export async function POST(req) {
    try {
        const { email, companyName, jobDescription, website } = await req.json()
        let riskScore = 0
        const reasons = []

        // 1. Email Domain Analysis
        if (email) {
            const domain = email.split('@')[1]?.toLowerCase()
            if (domain && FREE_EMAIL_PROVIDERS.includes(domain)) {
                riskScore += 50
                reasons.push("Recruiter is using a free email provider (e.g., Gmail/Yahoo). Legitimate companies use corporate domains (e.g., careers@company.co.za).")
            }
        }

        // 2. Keyword Analysis
        if (jobDescription) {
            const text = jobDescription.toLowerCase()
            SCAM_KEYWORDS.forEach(keyword => {
                if (text.includes(keyword)) {
                    riskScore += 25
                    reasons.push(`Suspicious keyword detected: "${keyword}". Legitimate jobs DO NOT ask for fees or deposits.`)
                }
            })
        }

        // 3. Web Reputation (if Company Name provided)
        if (companyName && companyName.length > 2) {
            const repCheck = await checkGoogleReputation(companyName)
            riskScore += repCheck.score
            reasons.push(...repCheck.findings)
        }

        // Cap Risk Score
        riskScore = Math.min(riskScore, 100)

        // Determine Verdict
        let verdict = 'Low Risk'
        if (riskScore >= 70) verdict = 'High Risk'
        else if (riskScore >= 40) verdict = 'Medium Risk'

        return NextResponse.json({
            riskScore,
            verdict,
            reasons,
            isSafe: riskScore < 40
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}
