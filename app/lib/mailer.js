/**
 * Send an email via MailChannels (Cloudflare Native).
 * Note: Function is still named sendSESEmail to prevent breaking changes across the app.
 *
 * @param {Object} env - The Cloudflare env object.
 * @param {Object} options - Email options.
 */
export async function sendSESEmail(env, { to, bcc, subject, html, from, attachments = [] }) {
    // MailChannels uses the Cloudflare Worker IP for auth, no API key needed!
    const senderEmail = from ? from.match(/<(.+)>/)?.[1] || from : 'info@checkitsa.co.za';
    const senderName = from ? from.split('<')[0].trim() : 'CheckIt SA';

    const toAddresses = Array.isArray(to) ? to : (to ? [to] : []);
    const bccAddresses = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

    const personalization = {
        to: toAddresses.length > 0 ? toAddresses.map(email => ({ email })) : [{ email: senderEmail }]
    };

    if (bccAddresses.length > 0) {
        personalization.bcc = bccAddresses.map(email => ({ email }));
    }

    const payload = {
        personalizations: [personalization],
        from: {
            email: senderEmail,
            name: senderName
        },
        reply_to: {
            email: 'info@checkitsa.co.za',
            name: 'CheckIt SA Support'
        },
        subject: subject,
        content: [
            {
                type: 'text/html',
                value: html
            }
        ]
    };

    try {
        const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 200 || res.status === 202) {
            console.log(`[MailChannels] Email sent successfully to ${toAddresses.join(', ') || 'BCC'}`);
            return { success: true };
        } else {
            const errorText = await res.text();
            console.error(`[MailChannels] API Error:`, res.status, errorText);
            return { success: false, error: `Status ${res.status}: ${errorText}` };
        }
    } catch (error) {
        console.error(`[MailChannels] Network Error:`, error);
        return { success: false, error: error.message };
    }
}
