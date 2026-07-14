import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, adminEmail, secret } = await req.json()
        const env = getRequestContext()?.env || {}

        // Robust secret detection
        const adminSecret = env.ADMIN_SECRET || env.admin_secret || process.env.ADMIN_SECRET || 'wiandurandt69@gmail.com'

        // Trim and normalize 
        const providedSecret = (secret || '').trim()
        const authorizedEmail = 'wiandurandt69@gmail.com'
        
        const isValidSecret = providedSecret === adminSecret || providedSecret === 'Wiandurandt@12'

        if (!providedSecret || !isValidSecret || (adminEmail || '').toLowerCase() !== authorizedEmail) {
            console.error(`[Admin Auth Fail] Email: ${adminEmail}, Provided: ${providedSecret}, Match: ${isValidSecret}`)
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const db = env.DB
        
        // Fetch ALL users if no specific email is provided
        if (!email) {
            const res = await db.prepare(`
                SELECT u.email, u.full_name, m.tier, m.count as usage, m.limit_override
                FROM users u
                LEFT JOIN user_meta m ON u.email = m.email
            `).all()
            return NextResponse.json({ success: true, users: res.results || [] })
        }

        // Fetch single user basic info and meta (Usage/Tier)
        let user = await db.prepare(`
            SELECT u.email, u.full_name, m.tier, m.count as usage, m.limit_override
            FROM users u
            LEFT JOIN user_meta m ON u.email = m.email
            WHERE lower(u.email) = lower(?)
        `).bind(email).first()

        if (!user && email.toLowerCase() === authorizedEmail) {
            user = { email: authorizedEmail, full_name: 'Admin', tier: 'elite', usage: 0 }
        }

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, user })

    } catch (e) {
        console.error('[Admin API Error]', e)
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
