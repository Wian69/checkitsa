import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { url, reason, type } = await req.json()
        const db = getRequestContext().env.DB

        const { success, error } = await db.prepare(
            'INSERT INTO reports (url, reason, type, created_at) VALUES (?, ?, ?, ?)'
        )
            .bind(url || 'N/A', reason || 'N/A', type || 'MANUAL', new Date().toISOString())
            .run()

        if (!success) throw new Error('D1 Insert Failed')

        return NextResponse.json({ message: 'Report submitted successfully' })
    } catch (error) {
        console.error('Report submission error:', error)
        return NextResponse.json({ message: 'Error submitting report: ' + error.message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const db = getRequestContext().env.DB
        const { results } = await db.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 20').all()

        return NextResponse.json({ reports: results || [] })
    } catch (error) {
        console.error('Fetch reports error:', error)
        return NextResponse.json({ reports: [] })
    }
}
