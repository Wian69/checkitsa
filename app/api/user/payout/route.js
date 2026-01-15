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

        if (user.wallet_balance < 100) {
            return NextResponse.json({ message: `Minimum payout is R100. Current balance: R${user.wallet_balance}` }, { status: 400 })
        }

        // 2. Prepare Admin Email
        const amount = user.wallet_balance
        const subject = `💸 Payout Request: R${amount} from ${user.fullName}`
        const html = `
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

        // 3. Send Email (Resend)
        const resendApiKey = process.env.RESEND_API_KEY
        if (resendApiKey) {
            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'CheckItSA Payouts <info@checkitsa.co.za>',
                    to: 'wiandurandt69@gmail.com',
                    subject: subject,
                    html: html
                })
            })

            if (!emailRes.ok) {
                const errText = await emailRes.text()
                console.error("Resend API Error:", errText)
                throw new Error(`Email Provider Error: ${emailRes.status} ${errText}`)
            }
        } else {
            console.error("No Email Provider Configured for Payouts")
            throw new Error("Server Misconfiguration: No Email Provider")
        }

        // 4. Reset Balance to 0
        const { success } = await db.prepare('UPDATE users SET wallet_balance = 0 WHERE id = ?').bind(user.id).run()

        if (!success) throw new Error("Failed to update wallet balance")

        return NextResponse.json({ message: 'Payout requested successfully. Admin notified.' })

    } catch (error) {
        console.error('Payout Error:', error)
        return NextResponse.json({ message: 'Server error' }, { status: 500 })
    }
}
