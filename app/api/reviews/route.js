
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET() {
    try {
        const db = getRequestContext().env.DB
        const { results } = await db.prepare("SELECT * FROM business_reviews WHERE status = 'verified' ORDER BY created_at DESC LIMIT 10").all()
        return NextResponse.json({ reviews: results || [] })
    } catch (e) {
        return NextResponse.json({ reviews: [] }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const { businessName, businessEmail, rating, title, content, reviewerName } = await req.json()
        const db = getRequestContext().env.DB

        if (!businessName || !rating || !content) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        const { success } = await db.prepare(
            `INSERT INTO business_reviews (business_name, business_email, rating, title, content, reviewer_name, status) VALUES (?, ?, ?, ?, ?, ?, 'verified')`
        ).bind(businessName, businessEmail || null, rating, title, content, reviewerName || 'Anonymous').run()

        if (success && businessEmail) {
            // Mock notification logic
            console.log(`[Notification] Would send email to ${businessEmail}: "You have a new review for ${businessName}. Please respond at https://checkitsa.co.za/reviews"`)
        }

        if (!success) throw new Error('DB Insert Failed')

        return NextResponse.json({ message: 'Review submitted' })
    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
