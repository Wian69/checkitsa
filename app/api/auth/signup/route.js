import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

// export const runtime = 'edge'

export async function POST(req) {
    try {
        const { fullName, email, password } = await req.json()
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

        // Create user
        // Note: D1 ID generation usually happens in DB or uuid in JS. Assuming DB autoincrement or similar.
        // If the schema expects a UUID, D1 doesn't auto-generate random UUIDs easily in SQL.
        // Ideally we generate a UUID here if the table is set up for it, 
        // OR we rely on AUTOINCREMENT integer.
        // Safest is to try INSERT and expect the DB handles ID.

        const { success } = await db.prepare(
            'INSERT INTO users (fullName, email, password, tier, searches) VALUES (?, ?, ?, ?, ?)'
        )
            .bind(fullName, email, password, 'free', 0)
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
