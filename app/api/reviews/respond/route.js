
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

async function ensureSchema(db) {
    try {
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS business_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_name TEXT NOT NULL,
                rating INTEGER NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                reviewer_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'verified'
            )
        `).run()

        const tableInfo = await db.prepare("PRAGMA table_info(business_reviews)").all()
        const columns = tableInfo.results.map(r => r.name)

        if (!columns.includes('business_email')) {
            await db.prepare("ALTER TABLE business_reviews ADD COLUMN business_email TEXT").run()
        }
        if (!columns.includes('response_content')) {
            await db.prepare("ALTER TABLE business_reviews ADD COLUMN response_content TEXT").run()
        }
        if (!columns.includes('responded_at')) {
            await db.prepare("ALTER TABLE business_reviews ADD COLUMN responded_at DATETIME").run()
        }
    } catch (e) {
        console.error('Schema Sync Error:', e)
    }
}

export async function POST(req) {
    try {
        const { reviewId, responseContent } = await req.json()
        const db = getRequestContext().env.DB
        await ensureSchema(db)

        if (!reviewId || !responseContent) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        const { success } = await db.prepare(
            `UPDATE business_reviews SET response_content = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(responseContent, reviewId).run()

        if (!success) throw new Error('DB Update Failed')

        return NextResponse.json({ message: 'Response saved' })
    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
