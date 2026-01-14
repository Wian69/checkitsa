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

        // 3. Authority Mapping
        // [TEST MODE ACTIVE] - Redirecting all reports to Admin for verification
        const AUTHORITY_MAP = {
            'WhatsApp': ['wiandurandt69@gmail.com'],
            'Social Media': ['wiandurandt69@gmail.com'],
            'SMS': ['wiandurandt69@gmail.com'],
            'Email': ['wiandurandt69@gmail.com'],
            'Gambling': ['wiandurandt69@gmail.com']
        }

        /* PRODUCTION MAPPING (Uncomment to go live)
        const AUTHORITY_MAP = {
            'WhatsApp': ['support@whatsapp.com', 'crimestop@saps.gov.za', 'fraud@safps.org.za'],
            'Social Media': ['phish@fb.com', 'abuse@facebook.com', 'support@instagram.com', 'support@x.com', 'support@tiktok.com', 'phishing@google.com', 'crimestop@saps.gov.za'],
            'SMS': ['complaints@waspa.org.za', 'crimestop@saps.gov.za'],
            'Email': ['crimestop@saps.gov.za', 'fraud@safps.org.za', 'reportphishing@apwg.org', 'phishing@google.com', 'phish@office365.microsoft.com'],
            'Gambling': ['crimestop@saps.gov.za']
        }
        */

        const authorities = AUTHORITY_MAP[type] || ['crimestop@saps.gov.za'] // Default fallback
        const recipients = [...new Set(['wiandurandt69@gmail.com', ...authorities])] // Unique list

        // 4. Prepare Attachments
        let attachments = []
        try {
            if (evidence) {
                let parsedEvidence = []
                if (typeof evidence === 'string') {
                    if (evidence.startsWith('[')) {
                        parsedEvidence = JSON.parse(evidence)
                    } else {
                        parsedEvidence = [evidence] // Legacy single string
                    }
                } else if (Array.isArray(evidence)) {
                    parsedEvidence = evidence
                }

                attachments = parsedEvidence.map((dataUrl, index) => {
                    const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
                    if (match) {
                        return {
                            name: `evidence_${index + 1}.jpg`,
                            content: match[2], // Base64 content
                            contentType: match[1] // Mime type e.g. image/jpeg
                        }
                    }
                    return null
                }).filter(Boolean)
            }
        } catch (e) {
            console.error('Attachment parsing error:', e)
        }

        // 5. Send Email Notification (Provider Agnostic)
        const resendApiKey = process.env.RESEND_API_KEY
        const brevoApiKey = process.env.BREVO_API_KEY
        // const adminSecret = process.env.ADMIN_SECRET || 'secret' // Moved below to reuse

        let sentEmail = false
        const adminSecret = process.env.ADMIN_SECRET || 'secret'
        const baseUrl = 'https://checkitsa.co.za'
        const reportId = success ? await db.prepare('SELECT id FROM scam_reports WHERE reporter_email = ? ORDER BY created_at DESC LIMIT 1').bind(email || 'N/A').first('id') : null
        const displayId = reportId || 'PENDING'

        const emailSubject = `[TEST MODE] 🚨 Scam Report [${type}]: ${scammer_details.substring(0, 30)}...`

        // Admin & Authority View
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #d32f2f;">New Scam Report - Action Required</h2>
                <p><strong>Type:</strong> ${type}</p>
                <p><strong>Reported By:</strong> ${name} (${email})</p>
                <hr />
                <h3>Incident Details</h3>
                <p><strong>Scammer/Suspect:</strong> ${scammer_details}</p>
                <p><strong>Description:</strong></p>
                <div style="background: #f9f9f9; padding: 10px; border-left: 3px solid #d32f2f;">
                    ${description}
                </div>
                <br />
                <p><em>This report has been automatically forwarded to relevant authorities including: ${authorities.slice(0, 3).join(', ')}...</em></p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                    <a href="${baseUrl}/api/admin/moderate?id=${displayId}&action=verify&token=${adminSecret}" style="background: green; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">Verify</a>
                    <a href="${baseUrl}/api/admin/moderate?id=${displayId}&action=reject&token=${adminSecret}" style="background: grey; color: white; padding: 10px 20px; text-decoration: none;">Reject</a>
                </div>
            </div>
        `

        if (reportId) {
            // TRY BREVO (Supports attachments easily)
            if (brevoApiKey) {
                try {
                    const toList = recipients.map(email => ({ email, name: email.split('@')[0] }))

                    await fetch('https://api.brevo.com/v3/smtp/email', {
                        method: 'POST',
                        headers: {
                            'api-key': brevoApiKey,
                            'Content-Type': 'application/json',
                            'accept': 'application/json'
                        },
                        body: JSON.stringify({
                            sender: { name: 'CheckItSA Automated Reporting', email: 'no-reply@checkitsa.co.za' },
                            to: toList,
                            subject: emailSubject,
                            htmlContent: emailHtml,
                            attachment: attachments.length > 0 ? attachments : undefined
                        })
                    })
                    sentEmail = true
                    console.log(`[Email] Jailed report sent to ${recipients.length} recipients via Brevo`)
                } catch (e) { console.error('Brevo Error:', e) }
            }

            // FALLBACK TO RESEND (Note: free tier limitations might apply to attachments/recipients)
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
                            bcc: recipients, // Use BCC for mass send via Resend to avoid privacy issues
                            reply_to: 'no-reply@checkitsa.co.za',
                            subject: emailSubject,
                            html: emailHtml,
                            attachments: attachments.map(a => ({ filename: a.name, content: a.content })) // Resend requires 'filename', Brevo 'name'
                        })
                    })
                    console.log(`[Email] Report sent via Resend fallback`)
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
