import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { planId, amountInCents, customLimit, email, returnUrl } = await req.json()

        if (!amountInCents || !planId || !email) {
            return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 })
        }

        let planName = 'CheckItSA Premium'
        if (planId === 'pro') planName = 'CheckItSA Pro'
        if (planId === 'elite') planName = 'CheckItSA Elite'
        if (planId === 'custom') planName = `CheckItSA Enterprise (${customLimit} Scans)`

        // Generate the secure checkout session with Yoco
        const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`
            },
            body: JSON.stringify({
                amount: amountInCents,
                currency: 'ZAR',
                // We append a placeholder query param here. Once Yoco generates the ID, we could append it, 
                // but actually, Yoco doesn't let us dynamically inject the ID into successUrl.
                // However, Yoco automatically appends ?status=paid to successUrl.
                successUrl: `${returnUrl}/success`,
                cancelUrl: returnUrl,
                metadata: {
                    email: email,
                    planId: planId,
                    customLimit: customLimit ? customLimit.toString() : '0'
                }
            })
        })

        const data = await yocoRes.json()

        if (!yocoRes.ok || !data.redirectUrl) {
            throw new Error(data.message || 'Failed to generate checkout URL from Yoco')
        }

        // We MUST return the checkout ID to the frontend so the frontend can securely pass it to the success page
        return NextResponse.json({
            success: true,
            redirectUrl: data.redirectUrl,
            checkoutId: data.id
        })

    } catch (error) {
        console.error('Create Subscription Checkout Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
