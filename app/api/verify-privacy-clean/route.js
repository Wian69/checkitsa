import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'
import dataBrokers from '@/app/lib/dataBrokers.json'
import { sendSESEmail } from '@/app/lib/mailer'
export const runtime = 'edge'

export async function POST(req) {
    try {
        const { checkoutId, targetName, targetEmail, targetPhone, brokersList } = await req.json()
        const { ctx } = getRequestContext()

        if (!checkoutId || !targetEmail) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 })
        }

        const env = getRequestContext().env;
        const yocoSecret = env.YOCO_SECRET_KEY || (typeof process !== 'undefined' ? process.env.YOCO_SECRET_KEY : 'sk_test_bbc990c36mPx2La97b440098747b');

        // Verify the checkout status directly with Yoco
        const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${yocoSecret}`
            }
        })

        const yocoData = await yocoRes.json()

        if (!yocoRes.ok || (yocoData.status !== 'completed' && yocoData.status !== 'paid')) {
            const errStr = JSON.stringify(yocoData);
            return NextResponse.json({ message: `Yoco Verification Failed: ${errStr}` }, { status: 400 })
        }

        // At this point payment is verified. Send the receipt email.
        const sendEmail = async () => {
            const brevoApiKey = process.env.BREVO_API_KEY
            const resendApiKey = process.env.RESEND_API_KEY

            const activeBrokers = brokersList && brokersList.length > 0 ? brokersList : dataBrokers;

            const bccListBrevo = activeBrokers.map(b => ({ email: b.email }))
            const bccListResend = activeBrokers.map(b => b.email)

            // 1. Send the Standard Receipt Email
            const receiptSubject = `Payment Receipt & Deletion Confirmation 🛡️`
            const receiptContent = `
                <p style="margin-bottom: 24px;">Hi ${targetName ? targetName.split(' ')[0] : 'there'},</p>
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
                    <p style="color: #d1d5db; line-height: 1.6;">We have identified matches and dispatched our automated deletion bots to the following ${activeBrokers.length} data brokers and public registries:</p>
                    <div style="column-count: 2; column-gap: 20px; color: #d1d5db; font-size: 0.85em; line-height: 1.6;">
                        <ul style="padding-left: 20px; margin: 0;">
                            ${activeBrokers.map(broker => `<li><strong>${broker.name}</strong></li>`).join('')}
                        </ul>
                    </div>
                </div>

                <p style="margin-bottom: 16px; color: #9ca3af;">This process typically takes 24 to 48 hours to propagate across all global servers. Once deleted, these data brokers are legally obligated under POPIA and GDPR to prevent your data from re-entering their active marketing lists.</p>
                
                <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #ef4444; margin-bottom: 24px;">
                    <h3 style="color: #ef4444; margin-top: 0;">Engine Activated: Legal Requests Dispatched</h3>
                    <p style="color: #d1d5db; line-height: 1.6;">We have just sent a formal Data Erasure Request (POPIA/GDPR) to <strong>${activeBrokers.length} data brokers</strong> on your behalf.</p>
                    <p style="color: #d1d5db; line-height: 1.6;"><strong>Important Notes:</strong></p>
                    <ul style="color: #d1d5db; padding-left: 20px; line-height: 1.6;">
                        <li>You have been sent a copy of this legal request (check your inbox for an email titled "DATA ERASURE REQUEST").</li>
                        <li>Brokers have a strict <strong>30-day legal timeframe</strong> to process the deletion across their global servers.</li>
                        <li><strong>ACTION REQUIRED:</strong> Some strict brokers may reply to the legal email asking you to verify your identity. If you receive an email from a broker, simply reply to confirm you want your data deleted.</li>
                    </ul>
                </div>
            `
            const receiptHtml = EMAIL_TEMPLATE('Privacy Clean Confirmation', receiptContent, `<a href="https://checkitsa.co.za/privacy-clean" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Run Another Scan</a>`)

            const cfEnv = getRequestContext().env;
            const apiKey = cfEnv?.SMTP2GO_API_KEY || (typeof process !== 'undefined' ? process.env.SMTP2GO_API_KEY : null);

            if (!apiKey) {
                throw new Error("CRITICAL: SMTP2GO API Key is missing from the environment.");
            }

            // 1. Raw SMTP2GO Fetch for Receipt
            const receiptPayload = {
                api_key: apiKey,
                sender: 'info@checkitsa.co.za',
                to: [targetEmail],
                subject: receiptSubject,
                html_body: receiptHtml
            };

            const receiptRes = await fetch('https://api.smtp2go.com/v3/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(receiptPayload)
            });

            if (!receiptRes.ok && receiptRes.status !== 200 && receiptRes.status !== 202) {
                const err = await receiptRes.text();
                throw new Error("SMTP2GO API Rejected Receipt: " + err);
            }

            // 2. Legal Blast has been moved to a separate endpoint /api/dispatch-legal-blast

            // 3. Log the dispatch for Admin Evidence
            if (cfEnv && cfEnv.DB) {
                try {
                    await cfEnv.DB.prepare(
                        'INSERT INTO dispatch_logs (target_name, target_email, target_phone, recipient_count) VALUES (?, ?, ?, ?)'
                    ).bind(targetName, targetEmail, targetPhone || '', activeBrokers.length).run();
                } catch (dbErr) {
                    console.error('Failed to save dispatch log to D1:', dbErr);
                }
            }

            return true;
        }

        // Force await so Cloudflare doesn't terminate the worker before emails send
        await sendEmail()

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Verify Privacy Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
