import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, password } = await req.json().catch(() => ({}))
        const db = getRequestContext().env.DB

        // 1. Check if user exists first
        const user = await db.prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first()

        if (!user) {
            return NextResponse.json({ message: 'Account does not exist. Please sign up first.' }, { status: 404 })
        }

        // 2. Check Password
        if (user.password !== password) {
            return NextResponse.json({ message: 'Invalid password' }, { status: 401 })
        }

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                tier: user.tier || 'free',
                referral_code: user.referral_code,
                wallet_balance: user.wallet_balance || 0
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 })
    }
}
