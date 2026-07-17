import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'
import { dispatchAuthority } from '@/app/lib/dispatchAuthority'

export const runtime = 'edge'

function redactSensitiveInfo(text) {
    if (!text) return text;
    // Redact Emails (keep first 2 letters)
    let redacted = text.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, (match, p1, p2) => {
        return p1.substring(0, 2) + '***@' + p2;
    });
    // Redact SA Phone numbers (keep prefix, mask middle)
    redacted = redacted.replace(/(\+?27|0)(\d{2})[-\s]?(\d{3})[-\s]?(\d{4})/g, (match, p1, p2, p3, p4) => {
        return p1 + p2 + ' *** ' + p4.substring(2);
    });
    // General 10-digit number fallback
    redacted = redacted.replace(/\b(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})\b/g, (match, p1, p2, p3) => {
        return p1 + ' *** ' + p3.substring(2);
    });
    return redacted;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const action = searchParams.get('action')
        const token = searchParams.get('token')
        const db = getRequestContext().env.DB

        // 1. Simple Security Check
        const adminSecret = process.env.ADMIN_SECRET || 'secret'
        if (token !== adminSecret) {
            return new Response('Unauthorized - Invalid Token', { status: 403 })
        }

        if (!id || !action) return new Response('Missing parameters', { status: 400 })

        // 2. Perform Action
        if (action === 'verify') {
            await db.prepare("UPDATE scam_reports SET status = 'verified' WHERE id = ?").bind(id).run()

            // START AUTHORITY NOTIFICATION LOGIC
            await dispatchAuthority(getRequestContext().env, db, id);
            // END AUTHORITY NOTIFICATION

            // START FACEBOOK INTEGRATION (Temporarily Disabled by User Request)
            let fbErrorStr = "Disabled by user";
            /*
            try {
                const fbToken = getRequestContext().env.FB_PAGE_ACCESS_TOKEN;
                const fbPageId = getRequestContext().env.FB_PAGE_ID;
                if (fbToken && fbPageId) {
                    const report = await db.prepare("SELECT * FROM scam_reports WHERE id = ?").bind(id).first();
                    if (report) {
                        const redactedDetails = redactSensitiveInfo(report.scammer_details);
                        const descriptionPreview = report.description ? report.description.substring(0, 300) + (report.description.length > 300 ? '...' : '') : '';
                        const message = `🚨 VERIFIED SCAM ALERT: ${report.scam_type} 🚨\n\nSuspect / Details: ${redactedDetails}\n\n${descriptionPreview}\n\nRead the full details and protect yourself on the CheckItSA website: https://checkitsa.co.za/`;
                        
                        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/feed`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${fbToken}`
                            },
                            body: JSON.stringify({
                                message: message,
                                link: 'https://checkitsa.co.za/'
                            })
                        });

                        if (!fbRes.ok) {
                            fbErrorStr = await fbRes.text();
                            console.error("Facebook API rejected the post:", fbErrorStr);
                        }
                    }
                } else {
                    fbErrorStr = "Missing FB_PAGE_ACCESS_TOKEN or FB_PAGE_ID in Cloudflare environment variables.";
                }
            } catch (fbError) {
                fbErrorStr = fbError.message;
                console.error("Facebook Post Error:", fbError.message);
            }
            */
            // END FACEBOOK INTEGRATION

            return new Response(`
                <html>
                    <head><title>Verified</title></head>
                    <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
                        <h1 style="color: green;">✅ Report Verified</h1>
                        <p>The report has been marked as verified and <strong>sent to authorities</strong>.</p>
                        ${fbErrorStr ? `<div style="margin-top:20px; padding: 10px; background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; border-radius: 5px;"><strong>Facebook Post Failed:</strong> ${fbErrorStr}</div>` : `<div style="margin-top:20px; padding: 10px; background: #d1fae5; border: 1px solid #10b981; color: #047857; border-radius: 5px;"><strong>Facebook Post Successful!</strong></div>`}
                        <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; font-size: 1rem; cursor: pointer;">Close Window</button>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } })
        }

        if (action === 'reject') {
            await db.prepare("UPDATE scam_reports SET status = 'rejected' WHERE id = ?").bind(id).run()
            return new Response(`
                <html>
                    <head><title>Rejected</title></head>
                    <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
                        <h1 style="color: #666;">❌ Report Rejected</h1>
                        <p>The report has been rejected and hidden from the public feed.</p>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 1rem; cursor: pointer;">Close Window</button>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } })
        }

        return new Response('Invalid Action', { status: 400 })

    } catch (error) {
        return new Response('Error: ' + error.message, { status: 500 })
    }
}
