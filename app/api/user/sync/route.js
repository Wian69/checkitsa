
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')
        if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 })

        const db = getRequestContext().env.DB

        // 1. Get User Meta (Usage/Tier)
        let meta = await db.prepare("SELECT * FROM user_meta WHERE email = ?").bind(email).first()

        // If no meta exists, create it (e.g. for existing users logging in for first time since sync update)
        if (!meta) {
            const user = await db.prepare("SELECT tier FROM users WHERE email = ?").bind(email).first()
            const initialTier = user ? user.tier : 'free'
            await db.prepare("INSERT INTO user_meta (email, tier) VALUES (?, ?)").bind(email, initialTier).run()
            meta = { email, usage_count: 0, tier: initialTier, custom_limit: 0, last_reset: new Date().toISOString() }
        }

        // 2. Get Search History
        const { results: history } = await db.prepare("SELECT * FROM search_history WHERE user_email = ? ORDER BY created_at DESC LIMIT 50").bind(email).all()

        return NextResponse.json({
            meta: {
                count: meta.usage_count,
                tier: meta.tier,
                limit: meta.custom_limit || 0, // Frontend handles tier defaults if 0
                lastReset: meta.last_reset
            },
            history: history || []
        })
    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const { email, type, action, data } = await req.json()
        const db = getRequestContext().env.DB

        if (action === 'increment') {
            await db.prepare("UPDATE user_meta SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?").bind(email).run()
        } else if (action === 'history') {
            await db.prepare(
                "INSERT INTO search_history (user_email, search_type, query, result_status) VALUES (?, ?, ?, ?)"
            ).bind(email, data.type, data.query, data.status).run()
        } else if (action === 'tier') {
            await db.prepare(
                "UPDATE user_meta SET tier = ?, custom_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?"
            ).bind(data.tier, data.customLimit || 0, email).run()

            // Also sync back to main users table for consistency
            await db.prepare("UPDATE users SET tier = ? WHERE email = ?").bind(data.tier, email).run()
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
