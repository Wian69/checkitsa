import { NextResponse } from 'next/server'

export const runtime = 'edge'

const FREE_EMAIL_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'yandex.com', 'mail.com'
]

const SCAM_KEYWORDS = [
    'training fee', 'admin fee', 'administration fee', 'uniform fee', 'deposit required',
    'bank account details', 'whatsapp interview', 'no experience needed', 'guaranteed job',
    'easy money', 'work from home agent', 'typing job', 'data entry clerk', 'sms job',
    'fax job', 'western union', 'moneygram', 'crypto', 'bitcoin', 'investment required',
    'start up kit', 'background check fee'
]

const FREE_Job_HOSTS = [
    'wixsite.com', 'weebly.com', 'yolasite.com', 'wordpress.com', 'blogspot.com', 'google.com/site',
    'squarespace.com', 'webflow.io', 'carrd.co', 'strikingly.com', 'jimdosite.com', 'site123.me',
    'mystrikingly.com', 'dudaone.com', 'mozello.com', 'webnode.com'
]

const URL_SHORTENERS = [
    'bit.ly', 'goo.gl', 'tinyurl.com', 'ow.ly', 't.co', 'is.gd', 'buff.ly', 'tr.im', 'rebrand.ly',
    'tiny.cc', 'shorturl.at', 'bl.ink', 'bitly.cx', 'cutt.ly', 'clck.ru', 'rb.gy', 'shorte.st'
]

const LEGIT_JOB_BOARDS = [
    'linkedin.com', 'pnet.co.za', 'indeed.com', 'glassdoor.com', 'careers24.com', 'bizcommunity.com',
    'offerzen.com', 'bestjobs.co.za', 'jobmail.co.za', 'gumtree.co.za', 'giraffe.co.za'
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
            item.title?.toLowerCase().includes('scam') ||
            item.title?.toLowerCase().includes('complaint') ||
            item.title?.toLowerCase().includes('beware')
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
        const { email, companyName, jobDescription, jobUrl } = await req.json()
        let riskScore = 0
        const reasons = []

        // 1. URL Analysis (Critical for Platform Scams)
        if (jobUrl) {
            const lowerUrl = jobUrl.toLowerCase()

            // Check for Shorteners (Scammers hide links)
            if (URL_SHORTENERS.some(domain => lowerUrl.includes(domain))) {
                riskScore += 45
                reasons.push("Job link uses a URL shortener (e.g. bit.ly). Legitimate companies link directly to their careers page.")
            }

            // Check for Free Hosts (Legit companies usually have own domain)
            if (FREE_Job_HOSTS.some(domain => lowerUrl.includes(domain))) {
                riskScore += 65
                reasons.push("Job site is hosted on a free platform (Wix/WordPress). Real companies use professional domains (e.g. careers.coke.co.za).")
            }

            // Whitelist Check: If it's NOT a known job board and NOT a free host, it's a proprietary domain.
            const isKnownBoard = LEGIT_JOB_BOARDS.some(board => lowerUrl.includes(board))
            if (isKnownBoard) {
                riskScore -= 20 // Bonus for using a trusted platform
            } else if (!FREE_Job_HOSTS.some(domain => lowerUrl.includes(domain))) {
                // If it's a custom domain we don't know, allow it but keep watching other signals
                // No penalty, but no bonus.
            }
        }

        // 2. Email Domain Analysis
        if (email) {
            const domain = email.split('@')[1]?.toLowerCase()
            if (domain && FREE_EMAIL_PROVIDERS.includes(domain)) {
                riskScore += 55
                reasons.push("Recruiter is using a free email provider (e.g., Gmail/Yahoo). Legitimate companies use corporate domains.")
            }
        }

        // 3. Keyword Analysis
        if (jobDescription) {
            const text = jobDescription.toLowerCase()
            SCAM_KEYWORDS.forEach(keyword => {
                if (text.includes(keyword)) {
                    riskScore += 30
                    reasons.push(`Suspicious keyword detected: "${keyword}". Legitimate jobs DO NOT ask for fees or deposits.`)
                }
            })
        }

        // 4. Web Reputation (if Company Name provided)
        if (companyName && companyName.length > 2) {
            const repCheck = await checkGoogleReputation(companyName)
            riskScore += repCheck.score
            reasons.push(...repCheck.findings)

            // CRITICAL UPGRADE: If risk is still 0 but we have no positive signals, assume cautious medium risk
            if (repCheck.score === 0 && riskScore < 30) {
                // Check if we found ANY significant results in the "digital footprint" check
                // The CheckGoogleReputation function returns score 30 for "stats.organic.length < 3"
                // So if we are here, it means we found some results, so it's likely okay.
            }
        } else if (jobUrl && !LEGIT_JOB_BOARDS.some(b => jobUrl.toLowerCase().includes(b))) {
            // If NO company name but a URL is provided, and it's not a big board, be suspicious
            // Only add this if we haven't already penalized the URL
            if (!FREE_Job_HOSTS.some(domain => jobUrl.toLowerCase().includes(domain)) && !URL_SHORTENERS.some(domain => jobUrl.toLowerCase().includes(domain))) {
                riskScore += 15
                reasons.push("Unknown job site with no Company Name provided. Please verify the company existence.")
            }
        }

        // Cap Risk Score
        riskScore = Math.min(Math.max(riskScore, 0), 100)

        // Determine Verdict
        let verdict = 'Low Risk'
        if (riskScore >= 60) verdict = 'High Risk'
        else if (riskScore >= 30) verdict = 'Medium Risk'

        return NextResponse.json({
            riskScore,
            verdict,
            reasons,
            isSafe: riskScore < 30
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}
