import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const body = await req.json()
        const { businessName, websiteUrl, description, category, logoUrl, registrationNumber, images, email } = body

        if (!businessName || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const env = getRequestContext().env
        if (!env.DB) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 })
        }

        // 1. Create a "pending" listing in the database
        const { meta } = await env.DB.prepare(
            `INSERT INTO listings (business_name, website_url, description, category, logo_url, registration_number, images, user_email, status, amount_paid)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 99.00)`
        ).bind(
            businessName, 
            websiteUrl || '', 
            description || '', 
            category || 'Other', 
            logoUrl || '', 
            registrationNumber || '', 
            JSON.stringify(images || []), 
            email
        ).run()

        const listingId = meta.last_row_id
        
        // 2. Initialize Yoco V3 Checkout
        const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY || 'sk_test_bbc990c36mPx2La97b440098747b'

        const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${YOCO_SECRET_KEY}`
            },
            body: JSON.stringify({
                amount: 9900, // R99.00 in cents
                currency: 'ZAR',
                successUrl: `https://checkitsa.co.za/advertise/success?listingId=${listingId}&checkoutId={checkoutId}`,
                cancelUrl: `https://checkitsa.co.za/advertise`,
                metadata: {
                    listingId: listingId.toString(),
                    type: 'promote_business'
                }
            })
        })

        const yocoData = await yocoRes.json()

        if (!yocoRes.ok) {
            console.error('Yoco Error:', yocoData)
            return NextResponse.json({ error: 'Failed to initialize payment gateway' }, { status: 500 })
        }

        // Return the V3 redirect URL
        return NextResponse.json({ 
            success: true, 
            checkoutUrl: yocoData.redirectUrl 
        })

    } catch (error) {
        console.error('Promote Business Checkout Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
