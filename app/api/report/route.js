import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const body = await req.json()
        const {
            name, email, phone,
            type, description, scammer_details, evidence, // New fields
            url, reason // Legacy fields fallback
        } = body

        const db = getRequestContext().env.DB

        // 1. Ensure Table Exists
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS scam_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reporter_name TEXT,
                reporter_email TEXT,
                reporter_phone TEXT,
                scam_type TEXT,
                description TEXT,
                scammer_details TEXT,
                evidence_image TEXT,
                created_at DATETIME
            )
        `).run()

        // 1b. Attempt Migration for existing tables (Add evidence column)
        try {
            await db.prepare('ALTER TABLE scam_reports ADD COLUMN evidence_image TEXT').run()
        } catch (e) {
            // Column likely exists, ignore
        }

        // 2. Insert Data
        const { success } = await db.prepare(
            `INSERT INTO scam_reports (
                reporter_name, reporter_email, reporter_phone, 
                scam_type, description, scammer_details, evidence_image, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(
                name || 'Anonymous',
                email || 'N/A',
                phone || 'N/A',
                type || 'General',
                description || reason || 'No description',
                scammer_details || url || 'N/A',
                evidence || null,
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
        // Fetch from the new, unified table
        const { results } = await db.prepare('SELECT * FROM scam_reports ORDER BY created_at DESC LIMIT 20').all()

        // Map to uniform frontend format
        const reports = (results || []).map(r => ({
            id: r.id,
            url: r.scammer_details || 'N/A', // Map detailed field to generic display
            reason: r.description || 'No description',
            type: r.scam_type || 'General',
            has_evidence: !!r.evidence_image,
            date: r.created_at
        }))

        return NextResponse.json({ reports })
    } catch (error) {
        console.error('Fetch reports error:', error)
        return NextResponse.json({ reports: [] })
    }
}
