import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, action } = await req.json()
        const db = getRequestContext().env.DB

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 })
        }

        // 1. Fetch Key
        if (action === 'fetch') {
            const user = await db.prepare('SELECT api_key FROM users WHERE email = ?').bind(email).first()
            return NextResponse.json({ apiKey: user?.api_key || null })
        }

        // 2. Generate/Rotate Key
        if (action === 'generate') {
            // Generate a secure random key
            const key = 'sk_live_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 10)

            await db.prepare('UPDATE users SET api_key = ? WHERE email = ?')
                .bind(key, email)
                .run()

            return NextResponse.json({ apiKey: key, message: 'New key generated' })
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('API Key Error:', error)
        return NextResponse.json({ message: 'Server Error' }, { status: 500 })
    }
}
