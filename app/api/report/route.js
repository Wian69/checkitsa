import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const body = await req.json()
        const {
            name, email, phone,
            type, description, scammer_details, // New fields
            url, reason // Legacy fields fallback
        } = body

        const db = getRequestContext().env.DB

        // 1. Ensure Table Exists (Auto-Migration for new features)
        // We use a separate table 'scam_reports' for the detailed incidents to avoid conflicts with the old 'reports' table if it exists.
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS scam_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reporter_name TEXT,
                reporter_email TEXT,
                reporter_phone TEXT,
                scam_type TEXT,
                description TEXT,
                scammer_details TEXT,
                created_at DATETIME
            )
        `).run()

        // 2. Insert Data
        const { success } = await db.prepare(
            `INSERT INTO scam_reports (
                reporter_name, reporter_email, reporter_phone, 
                scam_type, description, scammer_details, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(
                name || 'Anonymous',
                email || 'N/A',
                phone || 'N/A',
                type || 'General',
                description || reason || 'No description',
                scammer_details || url || 'N/A',
                new Date().toISOString()
            )
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
