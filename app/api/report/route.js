import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

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
        // [PRODUCTION MAPPING]
        const AUTHORITY_MAP = {
            'WhatsApp': ['support@whatsapp.com', 'fraud@safps.org.za'],
            'Social Media': ['phish@fb.com', 'abuse@facebook.com', 'support@instagram.com', 'support@x.com', 'support@tiktok.com', 'phishing@google.com'],
            'SMS': ['complaints@waspa.org.za'],
            'Email': ['fraud@safps.org.za', 'reportphishing@apwg.org', 'phishing@google.com', 'phish@office365.microsoft.com'],
            'Gambling': ['info@ngb.org.za'], // National Gambling Board
            // Bank Fraud Departments
            'Bank: FNB': ['phishing@fnb.co.za'],
            'Bank: Standard Bank': ['phishing@standardbank.co.za', 'fraud@standardbank.co.za'],
            'Bank: Absa': ['secmon@absa.co.za', 'fraud@absa.co.za'],
            'Bank: Nedbank': ['phishing@nedbank.co.za'],
            'Bank: Capitec': ['tipline@capitecbank.co.za'],
            'Bank: TymeBank': ['fraud@tymebank.co.za'],
            'Bank: Discovery Bank': ['phishing@discovery.co.za'],
            'Bank: Investec': ['fraud@investec.co.za']
        }

        // Define fallback
        let authorities = AUTHORITY_MAP[type]
        if (!authorities) {
            if (type && type.startsWith('Bank:')) {
                authorities = ['fraud@safps.org.za']
            } else {
                authorities = []
            }
        }

        // ALWAYS Include SAPS Crime Stop
        authorities.push('crimestop@saps.gov.za')

        const authoritiesList = [...new Set(authorities)]
        const adminEmail = 'wiandurandt69@gmail.com'

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

        let sentEmail = false
        const adminSecret = process.env.ADMIN_SECRET || 'secret'
        const baseUrl = 'https://checkitsa.co.za'
        const reportId = success ? await db.prepare('SELECT id FROM scam_reports WHERE reporter_email = ? ORDER BY created_at DESC LIMIT 1').bind(email || 'N/A').first('id') : null
        const displayId = reportId || 'PENDING'

        // [MODIFIED] Removed [TEST MODE] prefix
        const emailSubject = `🚨 Scam Report [${type}]: ${scammer_details.substring(0, 30)}...`

        // A. ADMIN TEMPLATE (With Verify/Reject Buttons)
        const adminHtmlContent = `
            <div style="margin-bottom: 20px; padding: 16px; background-color: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; color: #a5b4fc;">
                <strong>ADMIN CONTROL PANEL</strong><br/>
                This is an internal notification. Authorities have NOT been notified yet.<br/>
                <strong>Click VERIFY below to send the automated report to authorities.</strong>
            </div>

            <p style="margin-bottom: 8px;"><strong>Type:</strong> <span style="color: #fff;">${type}</span></p>
            <p style="margin-bottom: 20px;"><strong>Reported By:</strong> ${name} (${email} | ${phone || 'No Phone'})</p>
            
            <h3 style="color: #fff; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #374151; padding-bottom: 8px;">Incident Details</h3>
            <p style="margin-bottom: 8px;"><strong>Scammer/Suspect:</strong> <span style="color: #ef4444;">${scammer_details}</span></p>
            
            <div style="background-color: #1f2937; padding: 16px; border-radius: 6px; border-left: 4px solid #ef4444; color: #d1d5db; margin-bottom: 20px;">
                ${description}
            </div>
            
            <p style="font-size: 0.9em; color: #6b7280; font-style: italic; margin-bottom: 20px;">Pending Forwarding to: ${authoritiesList.slice(0, 3).join(', ')}...</p>
        `

        const adminActions = `
            <div style="display: flex; gap: 10px; justify-content: center;">
                <a href="${baseUrl}/api/admin/moderate?id=${displayId}&action=verify&token=${adminSecret}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 10px;">Verify & Send</a>
                <a href="${baseUrl}/api/admin/moderate?id=${displayId}&action=reject&token=${adminSecret}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reject</a>
            </div>
        `

        const adminHtml = EMAIL_TEMPLATE(`🚨 New Scam Report: ${type}`, adminHtmlContent, adminActions)

        // C. SEND LOGIC
        if (reportId) {
            // Function to send email
            const sendEmail = async (to, subject, html) => {
                let sent = false;
                // Brevo
                if (brevoApiKey) {
                    try {
                        const toList = Array.isArray(to) ? to.map(e => ({ email: e, name: e.split('@')[0] })) : [{ email: to, name: 'Recipient' }]
                        await fetch('https://api.brevo.com/v3/smtp/email', {
                            method: 'POST',
                            headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                            body: JSON.stringify({
                                sender: { name: 'CheckItSA Automated Reporting', email: 'no-reply@checkitsa.co.za' },
                                to: toList, subject, htmlContent: html,
                                attachment: attachments.length > 0 ? attachments : undefined
                            })
                        })
                        sent = true
                        console.log(`[Email] Sent to ${JSON.stringify(to)}`)
                    } catch (e) { console.error('Brevo Error:', e) }
                }
                // Resend Fallback
                if (!sent && resendApiKey) {
                    try {
                        await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                from: 'CheckItSA Reports <onboarding@resend.dev>',
                                bcc: Array.isArray(to) ? to : [to], // BCC for mass
                                reply_to: 'no-reply@checkitsa.co.za',
                                subject, html,
                                attachments: attachments.map(a => ({ filename: a.name, content: a.content }))
                            })
                        })
                        console.log(`[Email] Sent via Resend`)
                    } catch (e) { console.error('Resend Error:', e) }
                }
            }

            // 1. Send Admin Email ONLY
            await sendEmail(adminEmail, emailSubject + " [ADMIN ACTION REQUIRED]", adminHtml)

            // 2. [REMOVED] Authorities are NOT emailed here anymore. See /api/admin/moderate
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
