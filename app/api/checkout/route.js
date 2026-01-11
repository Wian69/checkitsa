import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { token, email } = await req.json()
        const db = getRequestContext().env.DB

        if (!token || !email) {
            return NextResponse.json({ message: 'Missing token or email' }, { status: 400 })
        }

        // 1. Charge Card via Yoco
        const yocoRes = await fetch('https://online.yoco.com/v1/charges/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Secret-Key': process.env.YOCO_SECRET_KEY || 'sk_test_9605494bxu8a31k9a359' // Fallback to Test Key
            },
            body: JSON.stringify({
                token: token,
                amountInCents: 9900, // R99.00
                currency: 'ZAR'
            })
        })

        const yocoData = await yocoRes.json()

        if (!yocoRes.ok || yocoData.status !== 'successful') {
            throw new Error(yocoData.errorCode || 'Payment failed')
        }

        // 2. Calculate Expiry Date (Now + 30 Days)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)

        // 3. Update User in DB
        await db.prepare(`
            UPDATE users 
            SET tier = 'premium', subscription_end = ?, searches = 0 
            WHERE email = ?
        `)
            .bind(expiryDate.toISOString(), email)
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
