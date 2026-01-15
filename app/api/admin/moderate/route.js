import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

export const runtime = 'edge'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const action = searchParams.get('action')
        const token = searchParams.get('token')
        const db = getRequestContext().env.DB

        // 1. Simple Security Check
        const adminSecret = process.env.ADMIN_SECRET || 'secret'
        if (token !== adminSecret) {
            return new Response('Unauthorized - Invalid Token', { status: 403 })
        }

        if (!id || !action) return new Response('Missing parameters', { status: 400 })

        // 2. Perform Action
        if (action === 'verify') {
            await db.prepare("UPDATE scam_reports SET status = 'verified' WHERE id = ?").bind(id).run()

            // START AUTHORITY NOTIFICATION LOGIC
            try {
                // Fetch report details
                const report = await db.prepare("SELECT * FROM scam_reports WHERE id = ?").bind(id).first()

                if (report) {
                    const AUTHORITY_MAP = {
                        'WhatsApp': ['support@whatsapp.com', 'fraud@safps.org.za'],
                        'Social Media': ['phish@fb.com', 'abuse@facebook.com', 'support@instagram.com', 'support@x.com', 'support@tiktok.com', 'phishing@google.com'],
                        'SMS': ['complaints@waspa.org.za'],
                        'Email': ['fraud@safps.org.za', 'reportphishing@apwg.org', 'phishing@google.com', 'phish@office365.microsoft.com'],
                        'Gambling': ['info@ngb.org.za'],
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

                    const type = report.scam_type || 'General'

                    let authorities = AUTHORITY_MAP[type]

                    // Fallback for "Bank: Other" or unknown types
                    if (!authorities) {
                        if (type && type.startsWith('Bank:')) {
                            // Generic bank fraud + SAFPS
                            authorities = ['fraud@safps.org.za']
                        } else {
                            authorities = []
                        }
                    }

                    // ALWAYS Include SAPS Crime Stop
                    authorities.push('crimestop@saps.gov.za')

                    const authoritiesList = [...new Set(authorities)]

                    // Parse Attachments
                    let attachments = []
                    try {
                        const evidence = report.evidence_image
                        if (evidence) {
                            let parsedEvidence = []
                            if (typeof evidence === 'string') {
                                if (evidence.startsWith('[')) {
                                    parsedEvidence = JSON.parse(evidence)
                                } else {
                                    parsedEvidence = [evidence]
                                }
                            } else if (Array.isArray(evidence)) {
                                parsedEvidence = evidence
                            }

                            attachments = parsedEvidence.map((dataUrl, index) => {
                                const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
                                if (match) {
                                    return {
                                        name: `evidence_${index + 1}.jpg`,
                                        content: match[2],
                                        contentType: match[1]
                                    }
                                }
                                return null
                            }).filter(Boolean)
                        }
                    } catch (e) {
                        console.error('Evidence parsing error in moderate:', e)
                    }

                    // Email Content
                    const emailSubject = `🚨 Scam Report [${type}]: ${(report.scammer_details || 'N/A').substring(0, 30)}...`

                    const authorityHtmlContent = `
                         <p style="margin-bottom: 20px;">This report was submitted via <strong>CheckItSA.co.za</strong> and was manually verified by our team.</p>
                         
                         <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 20px;">
                             <p style="margin: 0 0 8px 0;"><strong>Report Type:</strong> <span style="color: #fff;">${type}</span></p>
                             <p style="margin: 0;"><strong>Reporter Contact:</strong> ${report.reporter_name} (<a href="mailto:${report.reporter_email}" style="color: #a5b4fc;">${report.reporter_email}</a> | ${report.reporter_phone || 'No Phone'})</p>
                         </div>

                         <h3 style="color: #fff; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #374151; padding-bottom: 8px;">Incident Report</h3>
                         <p style="margin-bottom: 8px;"><strong>Suspect / Scammer Details:</strong></p>
                         <p style="color: #ef4444; font-weight: 600; margin-bottom: 16px;">${report.scammer_details}</p>
                         
                         <p style="margin-bottom: 8px;"><strong>Incident Description:</strong></p>
                         <div style="background-color: #1f2937; padding: 16px; border-radius: 6px; border-left: 4px solid #ef4444; color: #d1d5db; margin-bottom: 20px;">
                             ${report.description}
                         </div>
                    `

                    const authorityFooter = `
                        <p style="font-size: 0.85em; color: #6b7280; font-style: italic;">
                            This is an automated notification sent to relevant authorities for intelligence purposes. 
                            Evidence attachments (if any) are included below.
                        </p>
                    `

                    const authorityHtml = EMAIL_TEMPLATE(`Automated Scam Report`, authorityHtmlContent, authorityFooter)

                    // Send Email
                    const resendApiKey = process.env.RESEND_API_KEY
                    const brevoApiKey = process.env.BREVO_API_KEY

                    if (authoritiesList.length > 0) {
                        // Brevo
                        if (brevoApiKey) {
                            try {
                                const toList = authoritiesList.map(e => ({ email: e, name: 'Authority' }))
                                await fetch('https://api.brevo.com/v3/smtp/email', {
                                    method: 'POST',
                                    headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                                    body: JSON.stringify({
                                        sender: { name: 'CheckItSA Automated Reporting', email: 'no-reply@checkitsa.co.za' },
                                        to: toList, subject: emailSubject, htmlContent: authorityHtml,
                                        attachment: attachments.length > 0 ? attachments : undefined
                                    })
                                })
                                console.log(`[Moderate] Sent to authorities: ${authoritiesList.join(', ')}`)
                            } catch (e) { console.error('Moderate Brevo Error:', e) }
                        }
                        // Resend Fallback
                        else if (resendApiKey) {
                            try {
                                await fetch('https://api.resend.com/emails', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        from: 'CheckItSA Reports <onboarding@resend.dev>',
                                        bcc: authoritiesList,
                                        reply_to: 'no-reply@checkitsa.co.za',
                                        subject: emailSubject, html: authorityHtml,
                                        attachments: attachments.map(a => ({ filename: a.name, content: a.content }))
                                    })
                                })
                                console.log(`[Moderate] Sent to authorities via Resend`)
                            } catch (e) { console.error('Moderate Resend Error:', e) }
                        }
                    }
                }
            } catch (authError) {
                console.error("Error sending authority email:", authError)
                // We do NOT return error here, because the verify action itself succeeded. Just log it.
            }
            // END AUTHORITY NOTIFICATION

            return new Response(`
                <html>
                    <head><title>Verified</title></head>
                    <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
                        <h1 style="color: green;">✅ Report Verified</h1>
                        <p>The report has been marked as verified and <strong>sent to authorities</strong>.</p>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 1rem; cursor: pointer;">Close Window</button>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } })
        }

        if (action === 'reject') {
            await db.prepare("UPDATE scam_reports SET status = 'rejected' WHERE id = ?").bind(id).run()
            return new Response(`
                <html>
                    <head><title>Rejected</title></head>
                    <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
                        <h1 style="color: #666;">❌ Report Rejected</h1>
                        <p>The report has been rejected and hidden from the public feed.</p>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 1rem; cursor: pointer;">Close Window</button>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } })
        }

        return new Response('Invalid Action', { status: 400 })

    } catch (error) {
        return new Response('Error: ' + error.message, { status: 500 })
    }
}
