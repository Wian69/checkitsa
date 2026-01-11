import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')
        const db = getRequestContext().env.DB

        // 1. Verify Admin (Basic Email/Tier Check)
        const user = await db.prepare('SELECT tier FROM users WHERE email = ?').bind(email).first()
        if (!user || (user.tier !== 'elite' && user.tier !== 'custom' && user.tier !== 'ultimate')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
        }

        // 2. Fetch Pending Reports
        const { results } = await db.prepare("SELECT * FROM scam_reports WHERE status = 'pending' ORDER BY created_at DESC").all()

        return NextResponse.json({ reports: results })
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function PUT(req) {
    try {
        const { id, status, email } = await req.json()
        const db = getRequestContext().env.DB

        // 1. Verify Admin
        const user = await db.prepare('SELECT tier FROM users WHERE email = ?').bind(email).first()
        if (!user || user.tier !== 'elite' && user.tier !== 'ultimate') { // Strict check
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
        }

        // 2. Update Status
        await db.prepare('UPDATE scam_reports SET status = ? WHERE id = ?').bind(status, id).run()

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
