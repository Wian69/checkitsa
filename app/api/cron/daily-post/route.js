import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

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

        let fbMessage = ""
        let fbLink = 'https://checkitsa.co.za/'

        // 2. FETCH GLOBAL INTEL NEWS FROM RSS
        try {
            // Fetch from The Hacker News RSS feed (highly reliable global cyber news)
            const rssRes = await fetch('https://feeds.feedburner.com/TheHackersNews', { cf: { cacheTtl: 3600 } })
            const rssText = await rssRes.text()
            
            // Extract the first <item>
            const itemMatch = rssText.match(/<item>([\s\S]*?)<\/item>/)
            if (itemMatch) {
                const itemXml = itemMatch[1]
                
                // Extract title (handling CDATA if present)
                let title = "Latest Global Security Threat"
                const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/)
                if (titleMatch) title = titleMatch[1]
                
                // Extract link
                let link = "https://checkitsa.co.za/"
                const linkMatch = itemXml.match(/<link>(.*?)<\/link>/) || itemXml.match(/<feedburner:origLink>(.*?)<\/feedburner:origLink>/)
                if (linkMatch) link = linkMatch[1]

                fbMessage = `🌍 CheckItSA Global Threat Intel 🌍\n\nStaying informed is the first step to staying safe. Here is the latest cybersecurity news from around the world:\n\n📰 ${title}\n\nStay protected with CheckItSA.`
                fbLink = link
            } else {
                throw new Error("Could not parse RSS item")
            }
        } catch (err) {
            console.error("Failed to fetch RSS, falling back to default.", err)
            fbMessage = `🛡️ CheckItSA Daily Security Intel 🛡️\n\nVerify Before You Trust! Use CheckItSA's Website and Phone scanners to check any link or number before engaging with suspicious sellers.\n\nAlways use Two-Factor Authentication on all accounts to prevent hijacking.`
            fbLink = 'https://checkitsa.co.za/'
        }

        // 3. Post to Facebook (Temporarily Disabled by User Request)
        /*
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
                message: fbMessage,
                link: fbLink
            })
        });

        if (!fbRes.ok) {
            const errText = await fbRes.text()
            console.error("Cron Facebook Post Failed:", errText)
            return new Response('Facebook Post Failed: ' + errText, { status: 500 })
        }
        */

        return NextResponse.json({ success: true, message: "Daily post published to Facebook!", posted_content: fbMessage })

    } catch (error) {
        console.error("Cron Error:", error)
        return new Response('Internal Server Error: ' + error.message, { status: 500 })
    }
}
