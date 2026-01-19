
import { NextResponse } from 'next/server';
import { getInviteHtml, getMarketingHtml } from '@/utils/email-template';

export const runtime = 'edge';

// Test endpoint to send bulk emails using Cloudflare Env Vars
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const testEmail = searchParams.get('test_email');
        const senderEmail = searchParams.get('sender_email');
        const type = searchParams.get('type') || 'invite'; // 'invite' or 'marketing'

        if (senderEmail !== 'wiandurandt69@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized: Admin access only.' }, { status: 403 });
        }

        // 1. Get Access to Secrets (Cloudflare or Local)
        const BREVO_API_KEY = process.env.BREVO_API_KEY;

        if (!BREVO_API_KEY) {
            return NextResponse.json({ error: 'BREVO_API_KEY not configured in environment.' }, { status: 500 });
        }

        // 2. Define Recipient(s)
        const recipientEmail = testEmail || 'wiandurandt69@gmail.com';
        const recipientName = searchParams.get('business_name') || 'Business Owner';

        console.log(`[Invite] Sending ${type} to ${recipientEmail}...`);

        // 3. Select Template
        let subject = `Invitation: Get Verified on CheckItSA`;
        let htmlContent = getInviteHtml(recipientName);

        if (type === 'marketing') {
            subject = `How CheckItSA protects ${recipientName}`;
            htmlContent = getMarketingHtml(recipientName);
        }

        // 4. Send via Brevo API
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
                subject: subject,
                htmlContent: htmlContent
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
