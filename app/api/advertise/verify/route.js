import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { listingId, checkoutId } = await req.json()
        const env = getRequestContext().env

        if (!listingId || !checkoutId) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 })
        }

        // 1. Verify the checkout status directly with Yoco
        const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY
        const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${YOCO_SECRET_KEY}`
            }
        })

        const yocoData = await yocoRes.json()

        if (!yocoRes.ok || yocoData.status !== 'paid') {
            return NextResponse.json({ message: 'Payment not verified' }, { status: 400 })
        }

        // 2. Payment verified. Update listing to active.
        if (env && env.DB) {
            await env.DB.prepare(
                "UPDATE listings SET status = 'active', payment_ref = ? WHERE id = ?"
            ).bind(checkoutId, listingId).run()
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Verify Advertise Payment Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
