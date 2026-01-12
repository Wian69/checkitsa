import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, tier, adminEmail, secret } = await req.json()
        const adminSecret = process.env.ADMIN_SECRET

        if (!secret || secret !== adminSecret || adminEmail !== 'wiandurandt69@gmail.com') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        if (!email || !tier) {
            return NextResponse.json({ message: 'Email and tier required' }, { status: 400 })
        }

        const validTiers = ['free', 'pro', 'elite', 'custom']
        if (!validTiers.includes(tier)) {
            return NextResponse.json({ message: 'Invalid tier. Must be free, pro, elite, or custom' }, { status: 400 })
        }

        const db = getRequestContext().env.DB

        // Update main users table
        const userUpdate = await db.prepare("UPDATE users SET tier = ? WHERE email = ?").bind(tier, email).run()

        // Update user_meta (Usage/Tier)
        const metaUpdate = await db.prepare("UPDATE user_meta SET tier = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?").bind(tier, email).run()

        return NextResponse.json({
            success: true,
            message: `User ${email} tier updated to ${tier}`,
            db_status: {
                users: userUpdate.success,
                meta: metaUpdate.success
            }
        })

    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
