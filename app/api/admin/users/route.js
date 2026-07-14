import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, adminEmail, password } = await req.json()
        const env = getRequestContext()?.env || {}
        const db = env.DB
        
        const authorizedEmail = 'wiandurandt69@gmail.com'
        const providedPassword = (password || '').trim()

        // 1. Verify against actual DB password
        const adminAccount = await db.prepare("SELECT password FROM users WHERE email = ?").bind(authorizedEmail).first()
        
        if (!providedPassword || !adminAccount || adminAccount.password !== providedPassword || (adminEmail || '').toLowerCase() !== authorizedEmail) {
            console.error(`[Admin Auth Fail] Email: ${adminEmail}`)
            return NextResponse.json({ message: 'Unauthorized: Invalid Admin Password' }, { status: 401 })
        }
        
        // Fetch ALL users if no specific email is provided
        if (!email) {
            const res = await db.prepare(`
                SELECT email, fullName as full_name, tier, searches as usage
                FROM users
                ORDER BY createdAt DESC
            `).all()
            return NextResponse.json({ success: true, users: res.results || [] })
        }

        // Fetch single user basic info and meta (Usage/Tier)
        let user = await db.prepare(`
            SELECT email, fullName as full_name, tier, searches as usage
            FROM users
            WHERE lower(email) = lower(?)
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
