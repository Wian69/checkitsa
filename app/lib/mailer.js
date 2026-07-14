/**
 * Send an email via Resend.
 *
 * @param {Object} env - The Cloudflare env object containing keys.
 * @param {Object} options - Email options.
 */
export async function sendSESEmail(env, { to, bcc, subject, html, from, attachments = [] }) {
    const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

    if (!resendApiKey) {
        console.error("Missing RESEND_API_KEY in environment variables.");
        return false;
    }

    const sender = from || 'CheckItSA <no-reply@checkitsa.co.za>';
    const toAddresses = Array.isArray(to) ? to : (to ? [to] : []);
    const bccAddresses = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

    // Resend requires at least one "to" address if there's no bcc, but if there's only bcc, 
    // it will fail unless "to" is also provided or we map it properly.
    // Let's ensure "to" is populated if empty.
    const finalTo = toAddresses.length > 0 ? toAddresses : ['no-reply@checkitsa.co.za'];

    try {
        const payload = {
            from: sender,
            to: finalTo,
            subject: subject,
            html: html,
        };

        if (bccAddresses.length > 0) {
            payload.bcc = bccAddresses;
        }

        if (attachments && attachments.length > 0) {
            payload.attachments = attachments.map(att => ({
                filename: att.filename || att.name,
                content: att.content, // Must be raw base64 string
                content_id: att.cid ? att.cid : undefined
            }));
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            console.log(`[Resend] Email sent successfully to ${finalTo.join(', ')}`);
            return true;
        } else {
            console.error(`[Resend] API Error:`, data);
            return false;
        }
    } catch (error) {
        console.error(`[Resend] Network Error:`, error);
        return false;
    }
}
