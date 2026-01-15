import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, notifications_enabled } = await req.json()
        const db = getRequestContext().env.DB

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 })
        }

        // Update User Setting
        // SQLite stores booleans as 0 or 1
        const val = notifications_enabled ? 1 : 0

        const res = await db.prepare("UPDATE users SET notifications_enabled = ? WHERE email = ?")
            .bind(val, email)
            .run()

        if (res.meta.changes === 0) {
            // Optional: Handle case where user doesn't exist or no change
        }

        return NextResponse.json({ message: 'Settings updated', notifications_enabled: !!val })
    } catch (error) {
        console.error('Settings update error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

// GET current settings
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')
        const db = getRequestContext().env.DB

        if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 })

        const user = await db.prepare("SELECT notifications_enabled FROM users WHERE email = ?").bind(email).first()

        // Default to true (1) if null/undefined, or strict check
        const isEnabled = user ? (user.notifications_enabled !== 0) : true

        return NextResponse.json({ notifications_enabled: isEnabled })
    } catch (error) {
        return NextResponse.json({ notifications_enabled: true }, { status: 500 })
    }
}
