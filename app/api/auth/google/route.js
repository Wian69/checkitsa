import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { token, context } = await req.json()
        const db = getRequestContext().env.DB

        if (!token) {
            return NextResponse.json({ message: 'Missing token' }, { status: 400 })
        }

        // Verify Google Token (Edge-friendly method)
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)

        if (!googleRes.ok) {
            throw new Error('Invalid Google Token')
        }

        const payload = await googleRes.json()
        const { email, name, sub } = payload

        // Check if user exists
        let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        // STRICT Login Enforcement
        if (!user) {
            if (context === 'login') {
                return NextResponse.json({ message: 'You must signup first before logging in.' }, { status: 404 })
            }

            // If context is 'signup' (or undefined/fallback logic), create user
            const tempPassword = Math.random().toString(36).slice(-8)

            await db.prepare(
                'INSERT INTO users (fullName, email, password, tier, searches, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
            )
                .bind(name, email, tempPassword, 'free', 0, new Date().toISOString())
                .run()

            user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
        }

        return NextResponse.json({
            message: 'Authenticated',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                tier: user.tier || 'free'
            }
        })

    } catch (error) {
        console.error('Google Auth Error:', error)
        return NextResponse.json({ message: 'Authentication failed' }, { status: 401 })
    }
}
