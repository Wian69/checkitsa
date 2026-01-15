import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { fullName, email, password, ref } = await req.json()
        const db = getRequestContext().env.DB

        if (!fullName || !email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Check if user exists
        const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?')
            .bind(email)
            .first()

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 })
        }

        // Generate Referral Code (e.g., "Wian123" -> but random short string to avoid PII or collision)
        // Simple random string: 4 chars + 3 numbers
        const referralCode = Math.random().toString(36).substring(2, 9).toUpperCase()

        const { success } = await db.prepare(
            'INSERT INTO users (fullName, email, password, tier, searches, createdAt, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
            .bind(fullName, email, password, 'free', 0, new Date().toISOString(), referralCode, ref || null)
            .run()

        if (!success) {
            throw new Error('Failed to create user')
        }

        // Fetch the new user to return it (D1 doesn't reliably support RETURNING for all clients yet)
        const newUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        return NextResponse.json({
            message: 'User created',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                tier: 'free'
            }
        })
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 })
    }
}
