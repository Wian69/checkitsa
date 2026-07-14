/**
 * Send an email via Mailjet.
 * Note: Function is still named sendSESEmail to prevent breaking changes across the app.
 *
 * @param {Object} env - The Cloudflare env object containing keys.
 * @param {Object} options - Email options.
 */
export async function sendSESEmail(env, { to, bcc, subject, html, from, attachments = [] }) {
    const mailjetApiKey = env.MAILJET_API_KEY || process.env.MAILJET_API_KEY;
    const mailjetSecretKey = env.MAILJET_SECRET_KEY || process.env.MAILJET_SECRET_KEY;

    if (!mailjetApiKey || !mailjetSecretKey) {
        console.error("Missing MAILJET_API_KEY or MAILJET_SECRET_KEY in environment variables.");
        return false;
    }

    const senderEmail = from ? from.match(/<(.+)>/)?.[1] || from : 'no-reply@checkitsa.co.za';
    const senderName = from ? from.split('<')[0].trim() : 'CheckItSA';

    const toAddresses = Array.isArray(to) ? to : (to ? [to] : []);
    const bccAddresses = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

    const message = {
        From: { Email: senderEmail, Name: senderName },
        Subject: subject,
        HTMLPart: html,
    };

    if (toAddresses.length > 0) {
        message.To = toAddresses.map(email => ({ Email: email }));
    } else {
        // If no "To", Mailjet requires it, so we fallback to the sender
        message.To = [{ Email: senderEmail }];
    }

    if (bccAddresses.length > 0) {
        message.Bcc = bccAddresses.map(email => ({ Email: email }));
    }

    if (attachments && attachments.length > 0) {
        const inlined = [];
        const normal = [];

        attachments.forEach(att => {
            const attPayload = {
                ContentType: att.contentType || 'image/jpeg',
                Filename: att.filename || att.name,
                Base64Content: att.content
            };
            if (att.cid) {
                attPayload.ContentID = att.cid;
                inlined.push(attPayload);
            } else {
                normal.push(attPayload);
            }
        });

        if (inlined.length > 0) message.InlinedAttachments = inlined;
        if (normal.length > 0) message.Attachments = normal;
    }

    try {
        const authString = btoa(`${mailjetApiKey}:${mailjetSecretKey}`);
        
        const res = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Messages: [message] })
        });

        const data = await res.json();

        if (res.ok) {
            console.log(`[Mailjet] Email sent successfully to ${toAddresses.join(', ') || 'BCC'}`);
            return true;
        } else {
            console.error(`[Mailjet] API Error:`, JSON.stringify(data));
            return false;
        }
    } catch (error) {
        console.error(`[Mailjet] Network Error:`, error);
        return false;
    }
}
