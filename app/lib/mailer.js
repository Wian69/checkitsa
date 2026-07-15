/**
 * Send an email via SMTP2GO HTTP API.
 * Note: Function is still named sendSESEmail to prevent breaking changes across the app.
 *
 * @param {Object} env - The Cloudflare env object.
 * @param {Object} options - Email options.
 */
export async function sendSESEmail(env, { to, bcc, subject, html, from, attachments = [] }) {
    let apiKey = env?.SMTP2GO_API_KEY || (typeof process !== 'undefined' && process.env?.SMTP2GO_API_KEY);

    if (!apiKey) {
        console.error("[SMTP2GO] Missing SMTP2GO_API_KEY in environment variables.");
        return { success: false, error: "Missing API Key" };
    }

    const toAddresses = Array.isArray(to) ? to : (to ? [to] : []);
    const bccAddresses = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

    const payload = {
        api_key: apiKey,
        sender: 'CheckIt SA <info@checkitsa.co.za>',
        to: toAddresses.length > 0 ? toAddresses : ['info@checkitsa.co.za'],
        subject: subject,
        html_body: html,
        custom_headers: [
            {
                header: "Reply-To",
                value: "info@checkitsa.co.za"
            }
        ]
    };

    if (bccAddresses.length > 0) {
        payload.bcc = bccAddresses;
    }

    try {
        const res = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 200 || res.status === 202) {
            console.log(`[SMTP2GO] Email sent successfully to ${toAddresses.join(', ') || 'BCC'}`);
            return { success: true };
        } else {
            const errorText = await res.text();
            console.error(`[SMTP2GO] API Error:`, res.status, errorText);
            return { success: false, error: `Status ${res.status}: ${errorText}` };
        }
    } catch (error) {
        console.error(`[SMTP2GO] Network Error:`, error);
        return { success: false, error: error.message };
    }
}
