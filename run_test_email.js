const resendApiKey = 're_AqdBt9WW_2xS7jw2uuExuzJARbTuN2juR';

const emailSubject = `Payment Receipt & Deletion Confirmation 🛡️`
const emailContent = `
    <p style="margin-bottom: 24px;">Hi Wian,</p>
    <p style="margin-bottom: 24px;">Thank you for your payment of <strong>R199.00</strong>. Your Privacy Clean service is now active.</p>
    
    <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 24px;">
        <h3 style="color: #10b981; margin-top: 0;">Target Profile</h3>
        <ul style="color: #d1d5db; list-style: none; padding: 0;">
            <li><strong>Name:</strong> Wian</li>
            <li><strong>Email:</strong> wiandurandt69@gmail.com</li>
            <li><strong>Phone:</strong> +27821234567</li>
        </ul>
    </div>

    <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #ef4444; margin-bottom: 24px;">
        <h3 style="color: #ef4444; margin-top: 0;">Databases Being Scrubbed</h3>
        <p style="color: #d1d5db; line-height: 1.6;">We have dispatched bots to scrub your traces from <strong>over 150+ global and local databases</strong>, including:</p>
        <ul style="color: #d1d5db; padding-left: 20px; line-height: 1.6;">
            <li><strong>Truecaller Global Database</strong></li>
            <li><strong>Apollo.io B2B Lead List</strong></li>
            <li><strong>Local SA Marketing DB</strong></li>
            <li><em>And 147+ other known data brokers...</em></li>
        </ul>
    </div>

    <p style="margin-bottom: 16px; color: #9ca3af;">This process typically takes 24 to 48 hours to propagate across all global servers.</p>
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
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 1px solid #334155;">
                            <h1 style="color: #f8fafc; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CheckIt SA</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                            ${content}
                            ${actionBtn ? `<div style="text-align: center; margin-top: 32px;">${actionBtn}</div>` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
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

const emailHtml = HTML_WRAPPER(emailSubject, emailContent, `<a href="https://checkitsa.co.za/privacy-clean" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Run Another Scan</a>`);

async function send() {
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'CheckItSA Privacy <onboarding@resend.dev>',
                to: 'wiandurandt69@gmail.com',
                subject: emailSubject,
                html: emailHtml
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
