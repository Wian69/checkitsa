import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const password = searchParams.get('password')
        const adminSecret = process.env.ADMIN_SECRET || 'secret' // Basic auth for admin

        if (password !== adminSecret) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const env = getRequestContext().env
        if (!env.DB) {
            return NextResponse.json({ message: 'Database not bound' }, { status: 500 })
        }

        const { results } = await env.DB.prepare(
            'SELECT * FROM dispatch_logs ORDER BY created_at DESC LIMIT 100'
        ).all()

        return NextResponse.json({ success: true, logs: results })
    } catch (error) {
        console.error('Fetch dispatch logs error:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
