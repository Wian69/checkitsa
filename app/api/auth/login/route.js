import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, password } = await req.json()
        const db = getRequestContext().env.DB

        // D1 Query
        const user = await db.prepare('SELECT * FROM users WHERE email = ? AND password = ?')
            .bind(email, password)
            .first()

        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                tier: user.tier || 'free'
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 })
    }
}
