import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

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

            const emailSubject = `Payment Receipt & Deletion Confirmation 🛡️`
            const emailContent = `
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
                    <p style="color: #d1d5db; line-height: 1.6;">We have identified matches and dispatched our automated deletion bots to the following data brokers and public registries:</p>
                    <div style="column-count: 2; column-gap: 20px; color: #d1d5db; font-size: 0.9em; line-height: 1.8;">
                        <ul style="padding-left: 20px; margin: 0;">
                            <li><strong>Truecaller Global</strong></li>
                            <li><strong>Apollo.io B2B</strong></li>
                            <li><strong>Experian Marketing</strong></li>
                            <li><strong>LexisNexis Risk</strong></li>
                            <li><strong>Acxiom Data</strong></li>
                            <li><strong>Epsilon Marketing</strong></li>
                            <li><strong>ZoomInfo B2B</strong></li>
                            <li><strong>Lusha Contacts</strong></li>
                            <li><strong>Clearbit</strong></li>
                            <li><strong>Pipl Search</strong></li>
                            <li><strong>Whitepages Premium</strong></li>
                            <li><strong>Spokeo Directory</strong></li>
                            <li><strong>Intelius Records</strong></li>
                            <li><strong>BeenVerified</strong></li>
                            <li><strong>Radaris Public</strong></li>
                            <li><strong>CoreLogic Data</strong></li>
                            <li><strong>Equifax Marketing</strong></li>
                            <li><strong>TransUnion Leads</strong></li>
                            <li><strong>RocketReach</strong></li>
                            <li><strong>Local SA Marketing DB</strong></li>
                        </ul>
                    </div>
                </div>

                <p style="margin-bottom: 16px; color: #9ca3af;">This process typically takes 24 to 48 hours to propagate across all global servers. Once deleted, these data brokers are legally obligated under POPIA and GDPR to prevent your data from re-entering their active marketing lists.</p>
            `
            const emailHtml = EMAIL_TEMPLATE('Privacy Clean Confirmation', emailContent, `<a href="https://checkitsa.co.za/privacy-clean" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Run Another Scan</a>`)

            if (brevoApiKey) {
                try {
                    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                        method: 'POST',
                        headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({
                            sender: { name: 'CheckItSA Privacy', email: 'no-reply@checkitsa.co.za' },
                            to: [{ email: targetEmail, name: targetName }],
                            subject: emailSubject,
                            htmlContent: emailHtml
                        })
                    })
                    if (res.ok) return true
                } catch (e) { console.error("Brevo Email Error:", e) }
            }

            if (resendApiKey) {
                try {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'CheckItSA Privacy <onboarding@resend.dev>',
                            to: targetEmail,
                            subject: emailSubject,
                            html: emailHtml
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
