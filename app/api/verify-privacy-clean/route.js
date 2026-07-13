import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'
import dataBrokers from '@/app/lib/dataBrokers.json'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { checkoutId, targetName, targetEmail, targetPhone } = await req.json()
        const { ctx } = getRequestContext()

        if (!checkoutId || !targetEmail) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 })
        }

        // Verify the checkout status directly with Yoco
        const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer sk_test_bbc990c36mPx2La97b440098747b` // TEST KEY ACTIVE
            }
        })

        const yocoData = await yocoRes.json()

        if (!yocoRes.ok || yocoData.status !== 'paid') {
            return NextResponse.json({ message: 'Payment not verified' }, { status: 400 })
        }

        // At this point payment is verified. Send the receipt email.
        const sendEmail = async () => {
            const brevoApiKey = process.env.BREVO_API_KEY
            const resendApiKey = process.env.RESEND_API_KEY

            const bccListBrevo = dataBrokers.map(b => ({ email: b.email }))
            const bccListResend = dataBrokers.map(b => b.email)

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
            const receiptHtml = EMAIL_TEMPLATE('Privacy Clean Confirmation', receiptContent, `<a href="https://checkitsa.co.za/privacy-clean" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Run Another Scan</a>`)

            // 2. Send the Formal Legal Erasure Request (To User, BCC Brokers)
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
            const legalHtml = EMAIL_TEMPLATE(`Data Erasure Notice`, legalContent)

            if (brevoApiKey) {
                try {
                    // Send Receipt
                    await fetch('https://api.brevo.com/v3/smtp/email', {
                        method: 'POST',
                        headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({
                            sender: { name: 'CheckItSA Privacy', email: 'no-reply@checkitsa.co.za' },
                            to: [{ email: targetEmail, name: targetName }],
                            subject: receiptSubject,
                            htmlContent: receiptHtml
                        })
                    })
                    // Send Legal Blast
                    await fetch('https://api.brevo.com/v3/smtp/email', {
                        method: 'POST',
                        headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({
                            sender: { name: 'CheckIt SA Compliance', email: 'legal@checkitsa.co.za' },
                            to: [{ email: targetEmail, name: targetName }],
                            bcc: bccListBrevo,
                            subject: legalSubject,
                            htmlContent: legalHtml
                        })
                    })
                    return true
                } catch (e) { console.error("Brevo Email Error:", e) }
            }

            if (resendApiKey) {
                try {
                    // Send Receipt
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'CheckItSA Privacy <onboarding@resend.dev>',
                            to: targetEmail,
                            subject: receiptSubject,
                            html: receiptHtml
                        })
                    })
                    // Send Legal Blast
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'CheckIt SA Compliance <onboarding@resend.dev>',
                            to: targetEmail,
                            bcc: bccListResend,
                            subject: legalSubject,
                            html: legalHtml
                        })
                    })
                } catch (e) { console.error("Resend Email Error:", e) }
            }
        }

        if (ctx && ctx.waitUntil) {
            ctx.waitUntil(sendEmail())
        } else {
            await sendEmail()
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Verify Privacy Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
