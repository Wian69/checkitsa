import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { amountInCents, name, email, phone, returnUrl } = await req.json()

        if (!amountInCents) {
            return NextResponse.json({ message: 'Missing amount' }, { status: 400 })
        }

        // Generate the secure checkout session with Yoco
        const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer sk_test_bbc990c36mPx2La97b440098747b`
            },
            body: JSON.stringify({
                amount: amountInCents,
                currency: 'ZAR',
                successUrl: `${returnUrl}/success?status=paid`,
                cancelUrl: returnUrl,
                metadata: {
                    name,
                    email,
                    phone,
                    service: 'Privacy Clean'
                }
            })
        })

        const data = await yocoRes.json()

        if (!yocoRes.ok || !data.redirectUrl) {
            throw new Error(data.message || 'Failed to generate checkout URL from Yoco')
        }

        return NextResponse.json({ 
            success: true, 
            redirectUrl: data.redirectUrl,
            checkoutId: data.id 
        })

    } catch (error) {
        console.error('Create Yoco Checkout Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
