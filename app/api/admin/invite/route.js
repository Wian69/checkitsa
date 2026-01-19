
import { NextResponse } from 'next/server';
import { getInviteHtml } from '@/utils/email-template'; // Using the ES6 template we created

export const runtime = 'edge';

// Test endpoint to send bulk emails using Cloudflare Env Vars
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const testEmail = searchParams.get('test_email');

        // 1. Get Access to Secrets (Cloudflare or Local)
        // In Edge Runtime, process.env works for vars defined in .env.local during dev
        // or properly bound in Cloudflare Dashboard for prod.
        const BREVO_API_KEY = process.env.BREVO_API_KEY;

        if (!BREVO_API_KEY) {
            return NextResponse.json({ error: 'BREVO_API_KEY not configured in environment.' }, { status: 500 });
        }

        // 2. Define Recipient(s)
        // If query param 'test_email' is present, send only to that one.
        // Otherwise, this could be adapted to read from a DB or request body.
        const recipientEmail = testEmail || 'wiandurandt69@gmail.com';
        const recipientName = 'Business Owner';

        console.log(`[Invite] Sending test to ${recipientEmail}...`);

        // 3. Send via Brevo API
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: "CheckItSA Verification",
                    email: "info@checkitsa.co.za"
                },
                to: [
                    {
                        email: recipientEmail,
                        name: recipientName
                    }
                ],
                subject: `Invitation: Get Verified on CheckItSA`,
                htmlContent: getInviteHtml(recipientName)
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[Invite] Brevo Failed:', res.status, errBody);
            return NextResponse.json({ error: 'Brevo API Failed', details: errBody }, { status: res.status });
        }

        const data = await res.json();
        console.log(`[Invite] Success! Message ID: ${data.messageId}`);

        return NextResponse.json({
            success: true,
            message: `Invitation sent to ${recipientEmail}`,
            messageId: data.messageId
        });

    } catch (error) {
        console.error('[Invite] Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
