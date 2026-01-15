import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { token, email, amount, customLimit } = await req.json()
        const { env, ctx } = getRequestContext()
        const db = env.DB

        if (!token || !email || !amount) {
            return NextResponse.json({ message: 'Missing token, email, or amount' }, { status: 400 })
        }

        // 1. Charge Card via Yoco
        const yocoRes = await fetch('https://online.yoco.com/v1/charges/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Secret-Key': process.env.YOCO_SECRET_KEY
            },
            body: JSON.stringify({
                token: token,
                amountInCents: amount,
                currency: 'ZAR'
            })
        })

        const yocoData = await yocoRes.json()

        if (!yocoRes.ok || yocoData.status !== 'successful') {
            throw new Error(yocoData.errorCode || 'Payment failed')
        }

        // 2. Determine Plan Details
        let daysToAdd = 30
        let newTier = 'pro' // Default to Pro (safest fallback for paid users)
        let limit = 0
        let planDesc = "Standard Upgrade";

        if (customLimit > 0) {
            newTier = 'custom'
            limit = customLimit
            planDesc = "Custom Enterprise";
        } else if (amount >= 7900 && amount < 11000) {
            newTier = 'pro'
            planDesc = "Pro Plan";
        } else if (amount >= 11900) {
            newTier = 'elite'
            planDesc = "Elite Plan";
        }

        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + daysToAdd)

        console.log(`[Checkout] Processing ${planDesc} for ${email}. Resetting quota.`);

        // 3. Update User in DB (BULLETPROOF QUOTA RESET)
        // Explicitly setting searches = 0 ensures they get a fresh start immediately.
        await db.prepare(`
            UPDATE users 
            SET tier = ?, subscription_end = ?, searches = 0, custom_limit = ?, updated_at = CURRENT_TIMESTAMP
            WHERE email = ?
        `)
            .bind(newTier, expiryDate.toISOString(), limit, email)
            .run()

        // ---------------------------------------------------------
        // 4. Affiliate Logic: Credit Referrer (5% Comm) if eligible
        // ---------------------------------------------------------
        try {
            // Get user's referred_by code
            const currentUser = await db.prepare('SELECT referred_by FROM users WHERE email = ?').bind(email).first()
            const referrerCode = currentUser?.referred_by

            if (referrerCode) {
                // Find referrer
                const referrer = await db.prepare('SELECT id, tier, wallet_balance, email, fullName FROM users WHERE referral_code = ?').bind(referrerCode).first()

                // Pay commission to any referrer who exists
                if (referrer) {
                    const commission = amount * 0.05 // 5% of transaction (cents)
                    const commissionRand = commission / 100 // Convert to Rand for easier display/payout
                    const newBalance = (referrer.wallet_balance || 0) + commissionRand

                    await db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?')
                        .bind(commissionRand, referrer.id)
                        .run()

                    console.log(`[Affiliate] Credited R${commissionRand} to referrer ${referrer.id} for user ${email}`)

                    // --- Email Notification Logic ---
                    const sendEmail = async (toEmail, toName, subj, htmlBody) => {
                        const brevoApiKey = process.env.BREVO_API_KEY
                        const resendApiKey = process.env.RESEND_API_KEY

                        if (brevoApiKey) {
                            try {
                                const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                                    method: 'POST',
                                    headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                                    body: JSON.stringify({
                                        sender: { name: 'CheckItSA Rewards', email: 'no-reply@checkitsa.co.za' },
                                        to: [{ email: toEmail, name: toName }],
                                        subject: subj,
                                        htmlContent: htmlBody
                                    })
                                })
                                if (res.ok) return true
                            } catch (e) { console.error("Brevo Email Error:", e) }
                        }

                        // Fallback to Resend
                        if (resendApiKey) {
                            try {
                                const res = await fetch('https://api.resend.com/emails', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        from: 'CheckItSA Rewards <onboarding@resend.dev>',
                                        to: toEmail,
                                        subject: subj,
                                        html: htmlBody
                                    })
                                })
                                if (res.ok) return true
                            } catch (e) { console.error("Resend Email Error:", e) }
                        }
                        return false
                    }

                    const emailSubject = `Commission Earned! 💰`
                    const emailContent = `
                        <p style="margin-bottom: 24px;">Hi ${referrer.fullName ? referrer.fullName.split(' ')[0] : 'Partner'},</p>
                        <p style="margin-bottom: 24px;"><strong>Great news!</strong> Someone you referred just upgraded to a paid plan.</p>
                        
                        <div style="background-color: #1f2937; padding: 25px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 24px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 0.9em;">You Earned</p>
                            <span style="display: block; font-size: 32px; font-weight: 800; color: #10b981; text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);">R${commissionRand.toFixed(2)}</span>
                        </div>

                        <p style="margin-bottom: 16px;">We've added this amount to your wallet. Keep sharing to earn more!</p>
                        <p style="color: #6b7280; font-size: 0.9em; margin: 0;">You can withdraw your earnings from the dashboard once you reach R200.</p>
                    `

                    const emailHtml = EMAIL_TEMPLATE('Commission Earned! 💰', emailContent, `<a href="https://checkitsa.co.za/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View Dashboard</a>`)

                    // Send without awaiting to not block checkout response
                    if (ctx && ctx.waitUntil) {
                        ctx.waitUntil(sendEmail(referrer.email, referrer.fullName, emailSubject, emailHtml))
                    } else {
                        await sendEmail(referrer.email, referrer.fullName, emailSubject, emailHtml)
                    }
                }
            }
        } catch (affError) {
            // Don't fail the checkout if affiliate logic errors
            console.error('Affiliate Error:', affError)
        }
        // ---------------------------------------------------------

        // 4. Fetch Updated User
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        return NextResponse.json({
            message: 'Upgrade successful',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                tier: user.tier,
                subscriptionEnd: user.subscription_end
            }
        })

    } catch (error) {
        console.error('Checkout Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
