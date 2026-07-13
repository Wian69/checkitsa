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
            const resendApiKey = process.env.RESEND_API_KEY
            if (!resendApiKey) return false;

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
                    <ul style="color: #d1d5db; padding-left: 20px; line-height: 1.6;">
                        <li><strong>Truecaller Global Database</strong> (Name & Phone Number)</li>
                        <li><strong>Apollo.io B2B Lead List</strong> (Email & Professional Profile)</li>
                        <li><strong>Local SA Marketing DB</strong> (Direct Marketing Profile)</li>
                    </ul>
                </div>

                <p style="margin-bottom: 16px; color: #9ca3af;">Our automated bots have been dispatched to scrub these databases. This process typically takes 24 to 48 hours to propagate across all global servers.</p>
            `
            const emailHtml = EMAIL_TEMPLATE('Privacy Clean Confirmation', emailContent, `<a href="https://checkitsa.co.za/privacy-clean" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Run Another Scan</a>`)

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
            } catch (e) { console.error("Email Error:", e) }
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
