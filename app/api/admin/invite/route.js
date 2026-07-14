import { NextResponse } from 'next/server';
import { getInviteHtml, getMarketingHtml } from '@/utils/email-template';
import { sendSESEmail } from '@/app/lib/mailer';

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

        // 2. Define Recipient(s)
        const recipientEmail = testEmail || 'info@checkitsa.co.za';
        const recipientName = searchParams.get('business_name') || 'Business Owner';

        console.log(`[Invite] Sending ${type} to ${recipientEmail}...`);

        // 3. Select Template
        let subject = `Invitation: Get Verified on CheckItSA`;
        let htmlContent = getInviteHtml(recipientName);

        if (type === 'marketing') {
            subject = `How CheckItSA protects ${recipientName}`;
            htmlContent = getMarketingHtml(recipientName);
        }

        // 4. Send via MailChannels (using global mailer)
        const env = process.env; // Will be properly attached in Cloudflare Worker ctx
        const result = await sendSESEmail(env, {
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
            from: 'info@checkitsa.co.za'
        });

        if (!result.success) {
            return NextResponse.json({ error: 'MailChannels API Failed', details: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Invitation sent to ${recipientEmail}`
        });

    } catch (error) {
        console.error('[Invite] Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
