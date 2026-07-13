const resendApiKey = 're_AqdBt9WW_2xS7jw2uuExuzJARbTuN2juR';

const targetName = "Wian";
const targetEmail = "wiandurandt69@gmail.com";
const targetPhone = "+27821234567";

const legalSubject = `URGENT: Formal Data Erasure Request (POPIA/GDPR) - ${targetName}`
const legalContent = `
    <p>To the Data Protection Officer / Privacy Compliance Team,</p>
    <p>I am acting as the authorized legal agent for <strong>${targetName}</strong>.</p>
    <p>Under the provisions of the South African Protection of Personal Information Act (POPIA) and the General Data Protection Regulation (GDPR), I am formally requesting the immediate and permanent erasure of all personal data relating to the individual identified below from your databases, marketing lists, and partner syndication networks.</p>
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li><strong>Full Name:</strong> ${targetName}</li>
            <li><strong>Email Address:</strong> ${targetEmail}</li>
            <li><strong>Phone Number:</strong> ${targetPhone}</li>
        </ul>
    </div>
    <p>Please consider this a formal legal notice. You have 30 days to comply with this erasure request and provide confirmation.</p>
    <p>If you require identity verification to process this deletion, please reply directly to this email to contact the data subject (${targetEmail}).</p>
    <p>Sincerely,<br>CheckIt SA Legal Compliance Team</p>
`

const HTML_WRAPPER = (subject, content) => `
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

const legalHtml = HTML_WRAPPER(legalSubject, legalContent);

async function send() {
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'CheckIt SA Compliance <onboarding@resend.dev>',
                to: targetEmail,
                subject: legalSubject,
                html: legalHtml
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
