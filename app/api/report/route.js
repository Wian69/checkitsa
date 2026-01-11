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
                created_at DATETIME,
                status TEXT DEFAULT 'pending'
            )
        `).run()

        // 1b. Attempt Migration for existing tables
        try {
            await db.prepare('ALTER TABLE scam_reports ADD COLUMN evidence_image TEXT').run()
        } catch (e) {
            // Column likely exists, ignore
        }
        try {
            await db.prepare("ALTER TABLE scam_reports ADD COLUMN status TEXT DEFAULT 'pending'").run()
        } catch (e) {
            // Column likely exists, ignore
        }

        // 2. Insert Data
        const { success } = await db.prepare(
            `INSERT INTO scam_reports (
                reporter_name, reporter_email, reporter_phone, 
                scam_type, description, scammer_details, evidence_image, created_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
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

        // 3. Send Email Notification (Via Raw Fetch to avoid Resend SDK issues)
        const resendApiKey = process.env.RESEND_API_KEY
        if (resendApiKey && success) {
            const adminSecret = process.env.ADMIN_SECRET || 'secret'
            const baseUrl = 'https://checkitsa.co.za'

            // Get ID (Best effort: select latest from this user)
            const reportId = await db.prepare('SELECT id FROM scam_reports WHERE reporter_email = ? ORDER BY created_at DESC LIMIT 1').bind(email || 'N/A').first('id')

            if (reportId) {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'CheckItSA Reports <onboarding@resend.dev>',
                        to: 'info@checkitsa.co.za',
                        subject: `🚨 New Scam Report: ${type}`,
                        html: `
                            <h2>New Report Received</h2>
                            <p><strong>Reporter:</strong> ${name} (${email})</p>
                            <p><strong>Scammer:</strong> ${scammer_details}</p>
                            <p><strong>Description:</strong> ${description}</p>
                            <br/>
                            <div style="display: flex; gap: 10px;">
                                <a href="${baseUrl}/api/admin/moderate?id=${reportId}&action=verify&token=${adminSecret}" 
                                   style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                   ✅ VERIFY (Public)
                                </a>
                                <a href="${baseUrl}/api/admin/moderate?id=${reportId}&action=reject&token=${adminSecret}" 
                                   style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                   ❌ REJECT
                                </a>
                            </div>
                        `
                    })
                })
            }
        }

        if (!success) throw new Error('D1 Insert Failed')

        return NextResponse.json({ message: 'Report submitted successfully' })
    } catch (error) {
        console.error('Report submission error:', error)
        return NextResponse.json({ message: 'Error submitting report: ' + error.message }, { status: 500 })
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const db = getRequestContext().env.DB

        if (id) {
            // Fetch single report
            const report = await db.prepare('SELECT * FROM scam_reports WHERE id = ?').bind(id).first()

            if (!report) {
                return NextResponse.json({ error: 'Report not found' }, { status: 404 })
            }

            // Return sanitized single report
            return NextResponse.json({
                report: {
                    id: report.id,
                    url: report.scammer_details || 'N/A',
                    reason: report.description || 'No description',
                    type: report.scam_type || 'General',
                    has_evidence: !!report.evidence_image,
                    evidence_image: report.evidence_image, // Return image for details view
                    date: report.created_at
                }
            })
        }

        // Fetch list (existing logic)
        // Fetch list (existing logic) - STRICTLY VERIFIED ONLY
        const { results } = await db.prepare("SELECT * FROM scam_reports WHERE status = 'verified' ORDER BY created_at DESC LIMIT 20").all()

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
        return NextResponse.json({ reports: [] }, { status: 500 })
    }
}

export async function DELETE(req) {
    try {
        const { id, email } = await req.json()
        const db = getRequestContext().env.DB

        console.log(`[DELETE] Attempting to delete report ${id} for user ${email}`)

        if (!id || !email) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 })
        }

        // Verify ownership (or admin override) before deleting
        // Strictly enforcing email match ensures users can only delete their own reports
        const result = await db.prepare("DELETE FROM scam_reports WHERE id = ? AND reporter_email = ?").bind(id, email).run()

        console.log(`[DELETE] Result: ${JSON.stringify(result)}`)

        if (result.meta.changes === 0) {
            console.warn(`[DELETE] Failed: Report ${id} not found or email ${email} mismatch.`)
            return NextResponse.json({ message: 'Report not found or unauthorized' }, { status: 404 })
        }

        return NextResponse.json({ message: 'Report deleted successfully' })
    } catch (error) {
        console.error(`[DELETE] Error: ${error.message}`)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
