import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const SECURITY_INTEL_TIPS = [
    {
        title: "Banking & EFT Scams",
        content: `The most common banking scam in South Africa involves social engineering. Scammers often pose as bank officials claiming there is a "fraudulent transaction" on your account.
        
Key Red Flags:
• Being asked to install remote access software like AnyDesk or TeamViewer.
• Requesting your One-Time Pin (OTP) or App Approval.
• Urgency: Telling you that you must act "right now" to save your money.`
    },
    {
        title: "Facebook & Social Media Fraud",
        content: `Facebook Marketplace is a hotspot for localized fraud. Sellers often request "deposits" for items that don't exist, or buyers send fake "Proof of Payment" documents.
        
Key Red Flags:
• Prices that are "too good to be true."
• Sellers who refuse to meet in a safe, public place.
• Profiles that were created very recently (check the "Joined Facebook" date).`
    },
    {
        title: "Email Phishing & BEC",
        content: `Business Email Compromise (BEC) targets both companies and individuals. Scammers spoof the email addresses of lawyers, contractors, or even SARS.
        
Key Red Flags:
• Sudden changes to banking details for an invoice.
• Emails from "SARS" regarding a refund that requires you to click a link.
• Generic greetings like "Dear Valued Customer" instead of your name.`
    },
    {
        title: "Website & Online Store Clones",
        content: `Scammers often clone popular South African retail websites. They look identical but are designed to steal your credit card information.
        
Key Red Flags:
• Misspelled URLs (e.g., 'takeal0t.co.za' instead of 'takealot.com').
• Lack of contact information or a physical address.
• Only accepting manual EFT or Crypto as payment.`
    },
    {
        title: "5 Golden Rules for Safety",
        content: `1. Never Share Your OTP: No bank official will ever ask for your One-Time Pin or to approve a prompt on your app.
2. Verify Before You Trust: Use CheckItSA's Website and Phone scanners to check any link or number before engaging.
3. Enable 2FA: Always use Two-Factor Authentication on all accounts.
4. Check the URL: Always look at the address bar. If it's not exactly what you expect, close the tab.
5. Trust Your Gut: If a deal or conversation feels strange, it probably is. Scammers rely on creating pressure.`
    }
]

function redactSensitiveInfo(text) {
    if (!text) return text;
    let redacted = text.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, (match, p1, p2) => {
        return p1.substring(0, 2) + '***@' + p2;
    });
    redacted = redacted.replace(/(\+?27|0)(\d{2})[-\s]?(\d{3})[-\s]?(\d{4})/g, (match, p1, p2, p3, p4) => {
        return p1 + p2 + ' *** ' + p4.substring(2);
    });
    redacted = redacted.replace(/\b(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})\b/g, (match, p1, p2, p3) => {
        return p1 + ' *** ' + p3.substring(2);
    });
    return redacted;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const secret = searchParams.get('secret')
        const env = getRequestContext().env

        // 1. Security Verification
        const cronSecret = env.CRON_SECRET || 'secret' // Fallback for local testing, but you should set CRON_SECRET in Cloudflare
        if (secret !== cronSecret) {
            return new Response('Unauthorized', { status: 403 })
        }

        const db = env.DB

        // 2. Query Scams from the last 24 hours
        // SQLite datetime('now', '-1 day') gets the last 24 hours
        const { results } = await db.prepare(`
            SELECT * FROM scam_reports 
            WHERE status = 'verified' 
            AND created_at >= datetime('now', '-1 day')
            ORDER BY created_at DESC
        `).all()

        let fbMessage = ""

        if (results && results.length > 0) {
            // WE HAVE NEW SCAMS!
            fbMessage = `🚨 DAILY SCAM ALERT SUMMARY (${results.length} New Reports) 🚨\n\nIn the last 24 hours, CheckItSA has verified new scams targeting South Africans. Please be aware of the following:\n\n`
            
            // Show up to 3 scams so the post isn't too long
            const topScams = results.slice(0, 3)
            
            topScams.forEach((report, index) => {
                const redactedDetails = redactSensitiveInfo(report.scammer_details)
                const descPreview = report.description ? report.description.substring(0, 150).replace(/\n/g, ' ') + '...' : 'No details provided.'
                fbMessage += `🛑 ${index + 1}. [${report.scam_type}]\nSuspect: ${redactedDetails}\nDetails: ${descPreview}\n\n`
            })

            fbMessage += `To see the full list of verified scams and protect yourself, visit the CheckItSA Dashboard: https://checkitsa.co.za/`
        } else {
            // NO NEW SCAMS - POST EDUCATIONAL CONTENT
            // Pick a tip based on the day of the year so it rotates predictably
            const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
            const tipIndex = dayOfYear % SECURITY_INTEL_TIPS.length
            const tip = SECURITY_INTEL_TIPS[tipIndex]

            fbMessage = `🛡️ CheckItSA Daily Security Intel: ${tip.title} 🛡️\n\n${tip.content}\n\nAlways verify before you trust! Use our free scam verification tools at https://checkitsa.co.za/`
        }

        // 3. Post to Facebook
        const fbToken = env.FB_PAGE_ACCESS_TOKEN;
        const fbPageId = env.FB_PAGE_ID;

        if (!fbToken || !fbPageId) {
            return new Response('Facebook credentials not configured in Cloudflare', { status: 500 })
        }

        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/feed`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${fbToken}`
            },
            body: JSON.stringify({
                message: fbMessage
            })
        });

        if (!fbRes.ok) {
            const errText = await fbRes.text()
            console.error("Cron Facebook Post Failed:", errText)
            return new Response('Facebook Post Failed: ' + errText, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Daily post published to Facebook!", posted_content: fbMessage })

    } catch (error) {
        console.error("Cron Error:", error)
        return new Response('Internal Server Error: ' + error.message, { status: 500 })
    }
}
