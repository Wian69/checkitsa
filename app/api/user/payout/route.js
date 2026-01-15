import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

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
        const adminSubject = `💸 Payout Request: R${amount} from ${user.fullName}`
        const adminHtml = `
            <h2>New Payout Request</h2>
            <p><strong>User:</strong> ${user.fullName} (${user.email})</p>
            <p><strong>Amount:</strong> R${amount}</p>
            <hr/>
            <h3>Unverified Bank Details Provided:</h3>
            <ul>
                <li><strong>Bank:</strong> ${bankName}</li>
                <li><strong>Account Number:</strong> ${accountNumber}</li>
                <li><strong>Account Type:</strong> ${accountType}</li>
                <li><strong>Branch Code:</strong> ${branchCode || 'N/A'}</li>
            </ul>
            <hr/>
            <p>Please log in to your bank and manually Pay this user.</p>
        `

        // User Confirmation Email Content
        const userSubject = `✅ Payout Request Received: R${amount}`
        const userHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #10b981;">Payout Request Received</h2>
                <p>Hi ${user.fullName.split(' ')[0]},</p>
                <p>We have received your request to withdraw <strong>R${amount}</strong> from your affiliate wallet.</p>
                
                <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Bank:</strong> ${bankName}</p>
                    <p style="margin: 5px 0 0;"><strong>Account:</strong> ****${accountNumber.slice(-4)}</p>
                </div>

                <p>Our team will review your request. Once approved, funds typically reflect within <strong>48 hours</strong>.</p>
                <p style="color: #666; font-size: 0.9em;">If you did not request this, please contact support immediately.</p>
            </div>
        `

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
