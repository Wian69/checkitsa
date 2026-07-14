import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, tier, adminEmail, password } = await req.json()
        const env = getRequestContext()?.env || {}
        const db = env.DB

        const authorizedEmail = 'wiandurandt69@gmail.com'
        const providedPassword = (password || '').trim()

        // Verify against actual DB password
        const adminAccount = await db.prepare("SELECT password FROM users WHERE email = ?").bind(authorizedEmail).first()

        if (!providedPassword || !adminAccount || adminAccount.password !== providedPassword || (adminEmail || '').toLowerCase() !== authorizedEmail) {
            console.error(`[Admin Auth Fail] Email: ${adminEmail}`)
            return NextResponse.json({ message: 'Unauthorized: Invalid Admin Password' }, { status: 401 })
        }

        if (!email || !tier) {
            return NextResponse.json({ message: 'Email and tier required' }, { status: 400 })
        }

        const validTiers = ['free', 'pro', 'elite', 'custom']
        if (!validTiers.includes(tier)) {
            return NextResponse.json({ message: 'Invalid tier. Must be free, pro, elite, or custom' }, { status: 400 })
        }

        // Update main users table (Critical: Reset searches on tier change/renewal)
        // Also sets subscription_end to 30 days from now
        const userUpdate = await db.prepare(`
            UPDATE users 
            SET tier = ?, 
                searches = 0, 
                subscription_end = datetime('now', '+30 days'),
                updated_at = CURRENT_TIMESTAMP 
            WHERE email = ?
        `).bind(tier, email).run()

        // Update user_meta (Usage/Tier) - Legacy support
        try {
            await db.prepare("UPDATE user_meta SET tier = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?").bind(tier, email).run()
        } catch (e) {
            console.warn("user_meta update failed (table might not exist)", e)
        }

        return NextResponse.json({
            success: true,
            message: `User ${email} tier updated to ${tier}`,
            db_status: {
                users: userUpdate.success,
                meta: false
            }
        })

    } catch (e) {
        console.error('[Admin API Error]', e)
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
