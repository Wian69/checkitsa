import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const logoUrl = "https://checkitsa.co.za/logo.png"; 

const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Find Out Who is Selling Your Personal Data</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #030712;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); max-width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; border-bottom: 1px solid #1f2937; background: linear-gradient(to right, #1f2937, #111827); text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; color: #10b981; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Data Privacy Alert</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px; color: #d1d5db; line-height: 1.8; font-size: 16px;">
                            <p style="margin-top: 0;">Hi CheckItSA Member,</p>

                            <p>Have you ever wondered why you receive so many spam calls, scam text messages, and phishing emails?</p>

                            <p>Your personal information—including your name, phone number, and email address—is actively being stored and traded by underground Data Brokers without your consent.</p>

                            <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                                <h3 style="margin-top: 0; color: #ef4444; font-size: 18px; display: flex; align-items: center;">🚨 Introducing the Data Privacy Scanner</h3>
                                <p style="margin-bottom: 0; color: #fca5a5;">We've just launched a powerful new tool that scans the deep web to find exactly which public databases and data brokers have exposed your personal details.</p>
                            </div>

                            <h3 style="color: #f9fafb; font-size: 18px; margin-top: 30px;">How It Works:</h3>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="40" valign="top" style="padding-top: 5px;"><div style="background: #10b981; color: #000; width: 24px; height: 24px; border-radius: 50%; text-align: center; font-weight: bold; line-height: 24px;">1</div></td>
                                    <td style="padding-bottom: 15px;"><strong>Deep Scan your Identity:</strong> Find out instantly if your data is exposed on the internet.</td>
                                </tr>
                                <tr>
                                    <td width="40" valign="top" style="padding-top: 5px;"><div style="background: #10b981; color: #000; width: 24px; height: 24px; border-radius: 50%; text-align: center; font-weight: bold; line-height: 24px;">2</div></td>
                                    <td style="padding-bottom: 15px;"><strong>Dispatch Legal Erasure Requests:</strong> For a once-off fee of R199, we act as your Authorized Legal Agent to dispatch formal POPIA/GDPR takedown requests to the data brokers holding your information.</td>
                                </tr>
                                <tr>
                                    <td width="40" valign="top" style="padding-top: 5px;"><div style="background: #10b981; color: #000; width: 24px; height: 24px; border-radius: 50%; text-align: center; font-weight: bold; line-height: 24px;">3</div></td>
                                    <td style="padding-bottom: 0;"><strong>Automated Deletion:</strong> We legally force them to scrub your data from their servers to clean up your digital footprint and stop the spam.</td>
                                </tr>
                            </table>

                            <p style="text-align: center; font-size: 18px; color: #fff; margin-bottom: 30px;">Don't wait for your identity to be sold to scammers.<br>Take control of your privacy today.</p>

                            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                                <a href="https://checkitsa.co.za/privacy-clean" style="display: inline-block; padding: 16px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);">Scan My Data Now</a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #0d1117; text-align: center; border-top: 1px solid #1f2937;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                &copy; 2026 CheckItSA. All rights reserved.<br>
                                Stay Safe. Verify Everything.<br><br>
                                <a href="https://checkitsa.co.za/dashboard" style="color: #6366f1; text-decoration: none;">Manage Email Preferences</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export async function POST(req) {
    try {
        const { testEmail, isTest } = await req.json()
        const cfEnv = getRequestContext().env;
        const apiKey = cfEnv?.SMTP2GO_API_KEY || (typeof process !== 'undefined' ? process.env.SMTP2GO_API_KEY : null);

        if (!apiKey) {
            return NextResponse.json({ message: "SMTP2GO API Key is missing" }, { status: 500 });
        }

        let recipients = [];

        if (isTest && testEmail) {
            recipients = [testEmail];
        } else {
            // Fetch all users from DB
            const db = cfEnv.DB;
            const { results } = await db.prepare("SELECT email FROM users").all();
            if (results && results.length > 0) {
                recipients = results.map(u => u.email);
            }
        }

        if (recipients.length === 0) {
            return NextResponse.json({ message: "No recipients found" }, { status: 400 });
        }

        const payload = {
            api_key: apiKey,
            sender: 'info@checkitsa.co.za',
            to: isTest ? [testEmail] : ['info@checkitsa.co.za'],
            bcc: isTest ? undefined : recipients,
            subject: '🚨 NEW: Find Out Who is Selling Your Personal Data',
            html_body: htmlEmail
        };

        const res = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok && res.status !== 200 && res.status !== 202) {
            const err = await res.text();
            throw new Error("SMTP2GO Error: " + err);
        }

        return NextResponse.json({ success: true, count: recipients.length })

    } catch (error) {
        console.error('Newsletter Blast Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
