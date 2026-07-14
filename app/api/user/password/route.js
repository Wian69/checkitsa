import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, newPassword } = await req.json()
        const db = getRequestContext().env.DB

        if (!email || !newPassword) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Update password
        await db.prepare('UPDATE users SET password = ? WHERE email = ?')
            .bind(newPassword, email)
            .run()

        return NextResponse.json({ success: true, message: 'Password updated successfully' })
    } catch (error) {
        console.error('Password Update Error:', error)
        return NextResponse.json({ message: 'Server error' }, { status: 500 })
    }
}
