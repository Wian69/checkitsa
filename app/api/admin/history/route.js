import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')

        // Security Check
        if (email !== 'wiandurandt69@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const db = getRequestContext().env.DB

        // Fetch global history (latest first)
        const { results } = await db.prepare(
            "SELECT * FROM search_history ORDER BY created_at DESC LIMIT 100"
        ).all()

        return NextResponse.json({ success: true, history: results })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
