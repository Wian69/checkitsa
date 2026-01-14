import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { token, email, amount, customLimit } = await req.json()
        const db = getRequestContext().env.DB

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
