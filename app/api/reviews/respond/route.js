
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { reviewId, responseContent } = await req.json()
        const db = getRequestContext().env.DB

        if (!reviewId || !responseContent) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        const { success } = await db.prepare(
            `UPDATE business_reviews SET response_content = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(responseContent, reviewId).run()

        if (!success) throw new Error('DB Update Failed')

        return NextResponse.json({ message: 'Response saved' })
    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
