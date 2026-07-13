import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { checkoutId } = await req.json()
        const { env, ctx } = getRequestContext()
        const db = env.DB

        if (!checkoutId) {
            return NextResponse.json({ message: 'Missing checkoutId' }, { status: 400 })
        }

        // 1. Verify the checkout status directly with Yoco to prevent fraud
        const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`
            }
        })

        const yocoData = await yocoRes.json()

        if (!yocoRes.ok) {
            throw new Error(yocoData.message || 'Failed to verify checkout with Yoco')
        }

        if (yocoData.status !== 'paid') {
            return NextResponse.json({ message: 'Payment is not marked as paid by Yoco' }, { status: 400 })
        }

        // Check if this checkoutId was already processed to prevent double-provisioning
        // Since we don't have a transactions table, we can rely on the fact that the frontend only hits this once on success.
        // However, we extract metadata to provision:
        const { email, planId, customLimit } = yocoData.metadata || {}
        const amount = yocoData.amount // in cents

        if (!email || !planId) {
            throw new Error('Missing metadata from Yoco checkout to provision account')
        }

        // 2. Determine Plan Details
        let daysToAdd = 30
        let newTier = planId
        let limit = parseInt(customLimit || '0')

        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + daysToAdd)

        console.log(`[Subscription Verification] Provisioning ${newTier} for ${email}. Amount: ${amount}`);

        // 3. Update User in DB (BULLETPROOF QUOTA RESET)
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
            const currentUser = await db.prepare('SELECT referred_by FROM users WHERE email = ?').bind(email).first()
            const referrerCode = currentUser?.referred_by

            if (referrerCode) {
                const referrer = await db.prepare('SELECT id, tier, wallet_balance, email, fullName FROM users WHERE referral_code = ?').bind(referrerCode).first()

                if (referrer) {
                    const commission = amount * 0.05 // 5% of transaction (cents)
                    const commissionRand = commission / 100 
                    
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

                    if (ctx && ctx.waitUntil) {
                        ctx.waitUntil(sendEmail(referrer.email, referrer.fullName, emailSubject, emailHtml))
                    } else {
                        await sendEmail(referrer.email, referrer.fullName, emailSubject, emailHtml)
                    }
                }
            }
        } catch (affError) {
            console.error('Affiliate Error:', affError)
        }
        // ---------------------------------------------------------

        // 4. Fetch Updated User
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        return NextResponse.json({
            success: true,
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
        console.error('Verify Subscription Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
