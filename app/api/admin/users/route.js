import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, secret } = await req.json()
        const adminSecret = process.env.ADMIN_SECRET

        if (!secret || secret !== adminSecret) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 })
        }

        const db = getRequestContext().env.DB

        // Fetch user basic info and meta (Usage/Tier)
        const user = await db.prepare(`
            SELECT u.email, u.full_name, m.tier, m.count as usage, m.limit_override
            FROM users u
            LEFT JOIN user_meta m ON u.email = m.email
            WHERE u.email = ?
        `).bind(email).first()

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, user })

    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
