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
                (Array.isArray(evidence) && evidence.length > 0) ? JSON.stringify(evidence) : (typeof evidence === 'string' ? evidence : null),
                new Date().toISOString()
            )
            .run()

        // 3. Send Email Notification (Provider Agnostic)
        const resendApiKey = process.env.RESEND_API_KEY
        const brevoApiKey = process.env.BREVO_API_KEY

        let sentEmail = false
        const adminSecret = process.env.ADMIN_SECRET || 'secret'
        const baseUrl = 'https://checkitsa.co.za'
        const reportId = success ? await db.prepare('SELECT id FROM scam_reports WHERE reporter_email = ? ORDER BY created_at DESC LIMIT 1').bind(email || 'N/A').first('id') : null

        const emailSubject = `🚨 New Scam Report: ${type}`
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
                <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">CheckItSA Admin Alert</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <h2 style="color: #0f172a; margin-top: 0;">New Scam Report Submitted</h2>
                    <p>A new ${type} report has been received and requires moderation.</p>
                    
                    <div style="background: #fef2f2; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
                        <p style="margin: 0 0 10px 0;"><strong>Reporter:</strong> ${name} (${email})</p>
                        <p style="margin: 0 0 10px 0;"><strong>Scammer:</strong> ${scammer_details}</p>
                        <p style="margin: 0;"><strong>Description:</strong> ${description}</p>
                    </div>

                    <div style="text-align: center; margin-top: 30px; display: flex; justify-content: center; gap: 15px;">
                        <a href="${baseUrl}/api/admin/moderate?id=${reportId}&action=verify&token=${adminSecret}" 
                           style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                           ✅ VERIFY (Public)
                        </a>
                        <a href="${baseUrl}/api/admin/moderate?id=${reportId}&action=reject&token=${adminSecret}" 
                           style="display: inline-block; background: #64748b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                           ❌ REJECT
                        </a>
                    </div>

                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; text-align: center;">
                        <p>Standardized Admin Notification | checkitsa.co.za</p>
                    </div>
                </div>
            </div>
        `
        const emailText = `New Scam Report: ${type}\n\nReporter: ${name} (${email})\nScammer: ${scammer_details}\nDescription: ${description}\n\nVerify: ${baseUrl}/api/admin/moderate?id=${reportId}&action=verify&token=${adminSecret}\nReject: ${baseUrl}/api/admin/moderate?id=${reportId}&action=reject&token=${adminSecret}`

        if (reportId) {
            // TRY BREVO (Available in SA)
            if (brevoApiKey) {
                try {
                    await fetch('https://api.brevo.com/v3/smtp/email', {
                        method: 'POST',
                        headers: {
                            'api-key': brevoApiKey,
                            'Content-Type': 'application/json',
                            'accept': 'application/json'
                        },
                        body: JSON.stringify({
                            sender: { name: 'CheckItSA Reports', email: 'info@checkitsa.co.za' },
                            to: [{ email: 'wiandurandt69@gmail.com', name: 'Admin Account' }],
                            replyTo: { email: 'info@checkitsa.co.za' },
                            subject: emailSubject,
                            htmlContent: emailHtml,
                            textContent: emailText
                        })
                    })
                    sentEmail = true
                } catch (e) { console.error('Brevo Error:', e) }
            }

            // FALLBACK TO RESEND
            if (!sentEmail && resendApiKey) {
                try {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'CheckItSA Reports <info@checkitsa.co.za>',
                            to: 'wiandurandt69@gmail.com',
                            reply_to: 'info@checkitsa.co.za',
                            subject: emailSubject,
                            html: emailHtml,
                            text: emailText
                        })
                    })
                } catch (e) { console.error('Resend Error:', e) }
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
            // Fetch single report (existing logic)
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
                    date: report.created_at,
                    status: report.status || 'pending'
                }
            })
        }

        const email = searchParams.get('email')
        let results = []

        if (email) {
            // Fetch reports for a specific user (My Reports dashboard)
            // Returns ALL statuses (Pending, Verified, Rejected) so user can see their own history
            const res = await db.prepare("SELECT * FROM scam_reports WHERE lower(reporter_email) = lower(?) ORDER BY created_at DESC").bind(email).all()
            results = res.results
        } else {
            // Fetch public feed (existing logic) - STRICTLY VERIFIED ONLY
            const res = await db.prepare("SELECT * FROM scam_reports WHERE status = 'verified' ORDER BY created_at DESC LIMIT 20").all()
            results = res.results
        }

        // Map to uniform frontend format
        const reports = (results || []).map(r => ({
            id: r.id,
            url: r.scammer_details || 'N/A', // Map detailed field to generic display
            details: r.description || 'No description', // Changed 'reason' to 'details' to match frontend expected prop? 
            // WAIT: Frontend dashboard uses `r.details`, but public feed uses `r.reason`. 
            // Let's standardize or provide both.
            reason: r.description || 'No description',
            details: r.description || 'No description',
            type: r.scam_type || 'General',
            has_evidence: !!r.evidence_image,
            evidence_image: r.evidence_image,
            date: r.created_at,
            status: r.status || 'pending' // important for dashboard
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

        if (!id || !email) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 })
        }

        console.log(`[DELETE] Request - ID: ${id}, Email: ${email}`)

        // 1. Cast ID to integer (D1 strictness)
        const reportId = parseInt(id)

        // 2. Perform Delete with Case-Insensitive Email Check
        const result = await db.prepare("DELETE FROM scam_reports WHERE id = ? AND lower(reporter_email) = lower(?)")
            .bind(reportId, email)
            .run()

        console.log(`[DELETE] Changes: ${result.meta.changes}`)

        if (result.meta.changes === 0) {
            console.warn(`[DELETE] Fail - No match found for ID ${reportId} and Email ${email}`)
            return NextResponse.json({ message: 'Report not found or unauthorized' }, { status: 404 })
        }

        return NextResponse.json({ message: 'Report deleted successfully' })
    } catch (error) {
        console.error(`[DELETE] Error: ${error.message}`)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
