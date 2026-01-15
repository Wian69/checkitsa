import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, bankName, accountType, accountNumber, branchCode } = await req.json()
        const db = getRequestContext().env.DB

        if (!email || !bankName || !accountNumber) {
            return NextResponse.json({ message: 'Missing bank details' }, { status: 400 })
        }

        // 1. Fetch User & Verify Balance (Server-Side Check)
        const user = await db.prepare('SELECT id, fullName, wallet_balance, email FROM users WHERE email = ?').bind(email).first()

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

        if (user.wallet_balance < 200) {
            return NextResponse.json({ message: `Minimum payout is R200. Current balance: R${user.wallet_balance}` }, { status: 400 })
        }

        // 2. Prepare Emails
        const amount = user.wallet_balance

        // Admin Email Content
        const adminHtmlContent = `
            <p style="color: #9ca3af; margin-bottom: 20px;">A new payout request has been submitted.</p>
            
            <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0;"><strong>User:</strong> <span style="color: #fff;">${user.fullName}</span> (${user.email})</p>
                <p style="margin: 0;"><strong>Amount:</strong> <span style="color: #10b981; font-weight: bold; font-size: 1.2em;">R${amount}</span></p>
            </div>

            <h3 style="color: #fff; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #374151; padding-bottom: 10px;">Bank Details Provided by User:</h3>
            <ul style="list-style: none; padding: 0; margin: 0; color: #d1d5db;">
                <li style="padding: 8px 0; border-bottom: 1px solid #374151;"><strong>Bank:</strong> ${bankName}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #374151;"><strong>Account Number:</strong> ${accountNumber}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #374151;"><strong>Account Type:</strong> ${accountType}</li>
                <li style="padding: 8px 0;"><strong>Branch Code:</strong> ${branchCode || 'N/A'}</li>
            </ul>
        `
        const adminHtml = EMAIL_TEMPLATE(`💸 Payout Request: R${amount}`, adminHtmlContent, `<a href="mailto:${user.email}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Contact User</a>`)
        const adminSubject = `PCT_ADMIN: Payout Request R${amount} - ${user.fullName}`

        // User Confirmation Email Content
        const userHtmlContent = `
            <p style="margin-bottom: 24px;">Hi ${user.fullName.split(' ')[0]},</p>
            <p style="margin-bottom: 24px;">We have received your request to withdraw <strong>R${amount}</strong> from your affiliate wallet.</p>
            
            <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 0.9em;">Bank Details</p>
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #fff;">${bankName}</p>
                <p style="margin: 0; font-family: monospace; color: #d1d5db;">****${accountNumber.slice(-4)}</p>
            </div>

            <p style="margin-bottom: 16px;">Our team will review your request. Once approved, funds typically reflect within <strong>48 hours</strong>.</p>
            <p style="color: #6b7280; font-size: 0.9em; margin: 0;">If you did not request this, please contact support immediately.</p>
        `
        const userHtml = EMAIL_TEMPLATE('Payout Request Received', userHtmlContent)
        const userSubject = `✅ Payout Request Received: R${amount}`

        // 3. Send Emails (Brevo / Resend)
        const resendApiKey = process.env.RESEND_API_KEY
        const brevoApiKey = process.env.BREVO_API_KEY
        let sent = false

        // Helper to send email via available provider
        const sendEmail = async (toEmail, toName, subj, htmlBody) => {
            if (brevoApiKey) {
                try {
                    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                        method: 'POST',
                        headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({
                            sender: { name: 'CheckItSA Payouts', email: 'no-reply@checkitsa.co.za' },
                            to: [{ email: toEmail, name: toName }],
                            subject: subj,
                            htmlContent: htmlBody
                        })
                    })
                    if (res.ok) return true
                    console.error("Brevo Error:", await res.text())
                } catch (e) { console.error("Brevo Fetch Error:", e) }
            }

            if (resendApiKey) {
                try {
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'CheckItSA Payouts <onboarding@resend.dev>',
                            to: toEmail,
                            subject: subj,
                            html: htmlBody
                        })
                    })
                    if (res.ok) return true
                    console.error("Resend Error:", await res.text())
                } catch (e) { console.error("Resend Fetch Error:", e) }
            }
            return false
        }

        // Send Admin Notification
        const adminSent = await sendEmail('wiandurandt69@gmail.com', 'Admin', adminSubject, adminHtml)

        // Send User Confirmation
        const userSent = await sendEmail(user.email, user.fullName, userSubject, userHtml)

        if (!adminSent && !userSent) {
            console.error("No Email Provider Configured or All Failed")
            throw new Error("Failed to send payout notification emails.")
        }

        // 4. Reset Balance to 0
        const { success } = await db.prepare('UPDATE users SET wallet_balance = 0 WHERE id = ?').bind(user.id).run()

        if (!success) throw new Error("Failed to update wallet balance")

        return NextResponse.json({ message: 'Payout requested successfully.' })

    } catch (error) {
        console.error('Payout Error:', error)
        return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
    }
}
