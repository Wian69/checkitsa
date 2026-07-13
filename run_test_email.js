const fs = require('fs');
const resendApiKey = 're_AqdBt9WW_2xS7jw2uuExuzJARbTuN2juR';

const dataBrokers = JSON.parse(fs.readFileSync('./app/lib/dataBrokers.json', 'utf8'));

const targetName = "Wian";
const targetEmail = "wiandurandt69@gmail.com";
const targetPhone = "+27821234567";

const receiptSubject = `Payment Receipt & Deletion Confirmation 🛡️`
const receiptContent = `
    <p style="margin-bottom: 24px;">Hi ${targetName.split(' ')[0]},</p>
    <p style="margin-bottom: 24px;">Thank you for your payment of <strong>R199.00</strong>. Your Privacy Clean service is now active.</p>
    
    <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 24px;">
        <h3 style="color: #10b981; margin-top: 0;">Target Profile</h3>
        <ul style="color: #d1d5db; list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${targetName}</li>
            <li><strong>Email:</strong> ${targetEmail}</li>
            <li><strong>Phone:</strong> ${targetPhone}</li>
        </ul>
    </div>

    <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #ef4444; margin-bottom: 24px;">
        <h3 style="color: #ef4444; margin-top: 0;">Databases Being Scrubbed</h3>
        <p style="color: #d1d5db; line-height: 1.6;">We have identified matches and dispatched our automated deletion bots to the following ${dataBrokers.length} data brokers and public registries:</p>
        <div style="column-count: 2; column-gap: 20px; color: #d1d5db; font-size: 0.85em; line-height: 1.6;">
            <ul style="padding-left: 20px; margin: 0;">
                ${dataBrokers.map(broker => `<li><strong>${broker.name}</strong></li>`).join('')}
            </ul>
        </div>
    </div>

    <p style="margin-bottom: 16px; color: #9ca3af;">This process typically takes 24 to 48 hours to propagate across all global servers. Once deleted, these data brokers are legally obligated under POPIA and GDPR to prevent your data from re-entering their active marketing lists.</p>
    
    <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #ef4444; margin-bottom: 24px;">
        <h3 style="color: #ef4444; margin-top: 0;">Engine Activated: Legal Requests Dispatched</h3>
        <p style="color: #d1d5db; line-height: 1.6;">We have just sent a formal Data Erasure Request (POPIA/GDPR) to <strong>over 50 global and local data brokers</strong> on your behalf.</p>
        <p style="color: #d1d5db; line-height: 1.6;"><strong>Important Notes:</strong></p>
        <ul style="color: #d1d5db; padding-left: 20px; line-height: 1.6;">
            <li>You have been sent a copy of this legal request (check your inbox for an email titled "DATA ERASURE REQUEST").</li>
            <li>Brokers have a strict <strong>30-day legal timeframe</strong> to process the deletion across their global servers.</li>
            <li><strong>ACTION REQUIRED:</strong> Some strict brokers may reply to the legal email asking you to verify your identity. If you receive an email from a broker, simply reply to confirm you want your data deleted.</li>
        </ul>
    </div>
`

const HTML_WRAPPER = (subject, content, actionBtn) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 1px solid #334155;">
                            <h1 style="color: #f8fafc; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CheckIt SA</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                            ${content}
                            ${actionBtn ? `<div style="text-align: center; margin-top: 32px;">${actionBtn}</div>` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #334155;">
                            <p style="color: #64748b; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} CheckIt SA. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const receiptHtml = HTML_WRAPPER(receiptSubject, receiptContent, `<a href="https://checkitsa.co.za/privacy-clean" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Run Another Scan</a>`);

async function send() {
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'CheckIt SA Compliance <onboarding@resend.dev>',
                to: targetEmail,
                subject: receiptSubject,
                html: receiptHtml
            })
        });
        
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", data);
    } catch(e) {
        console.error(e);
    }
}
send();
