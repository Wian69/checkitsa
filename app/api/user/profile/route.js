import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 })

    try {
        const db = getRequestContext().env.DB
        let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

        // Lazy Backfill: If no referral code, generate one now
        if (!user.referral_code) {
            const newCode = Math.random().toString(36).substring(2, 9).toUpperCase()
            await db.prepare('UPDATE users SET referral_code = ? WHERE email = ?').bind(newCode, email).run()
            user.referral_code = newCode // Update object to return
        }

        // Return fresh user data (sanitize password)
        const { password, ...safeUser } = user
        return NextResponse.json({ user: safeUser })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ message: 'Server error' }, { status: 500 })
    }
}
