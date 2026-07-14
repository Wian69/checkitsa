import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'
import { sendSESEmail } from '@/app/lib/mailer'

export async function dispatchAuthority(env, db, reportId) {
    try {
        const report = await db.prepare("SELECT * FROM scam_reports WHERE id = ?").bind(reportId).first()
        if (!report) return false;

        const AUTHORITY_MAP = {
            'WhatsApp': ['support@whatsapp.com', 'fraud@safps.org.za'],
            'Social Media': ['phish@fb.com', 'abuse@facebook.com', 'support@instagram.com', 'support@x.com', 'support@tiktok.com', 'phishing@google.com'],
            'SMS': ['complaints@waspa.org.za'],
            'Email': ['fraud@safps.org.za', 'reportphishing@apwg.org', 'phishing@google.com', 'phish@office365.microsoft.com'],
            'Gambling': ['info@ngb.org.za'],
            'Bank: FNB': ['phishing@fnb.co.za', 'fnbcard@fnb.co.za'],
            'Bank: Standard Bank': ['reportfraud@standardbank.co.za', 'phishing@standardbank.co.za'],
            'Bank: Absa': ['fraud@absa.co.za', 'secmon@absa.co.za'],
            'Bank: Nedbank': ['phishing@nedbank.co.za'],
            'Bank: Capitec': ['tipline@capitecbank.co.za', 'phishing@capitecbank.co.za'],
            'Bank: TymeBank': ['fraud@tymebank.co.za', 'service@tymebank.co.za'],
            'Bank: Discovery Bank': ['discoveryforensics@whistleblowing.co.za', 'phishing@discovery.co.za'],
            'Bank: Investec': ['investecfd@investec.co.za'],
            'Bank: African Bank': ['fdetection@africanbank.co.za', 'africanbank@tip-offs.com']
        }

        const type = report.scam_type || 'General'
        let authorities = AUTHORITY_MAP[type]

        if (!authorities) {
            if (type && type.startsWith('Bank:')) authorities = ['fraud@safps.org.za']
            else authorities = []
        }

        authorities.push('crimestop@saps.gov.za', 'fraud@safps.org.za')
        let authoritiesList = [...new Set(authorities)]

        // 🚨 SAFETY INTERCEPTOR FOR TESTING 🚨
        // If the report was submitted by the admin, only send the authority email to the admin to prevent spamming real authorities.
        if (report.reporter_email && report.reporter_email.toLowerCase() === 'wiandurandt69@gmail.com') {
            console.log('[TEST MODE] Intercepting authority dispatch for admin email.');
            authoritiesList = ['wiandurandt69@gmail.com'];
        }

        let attachments = []
        try {
            const evidence = report.evidence_image
            if (evidence) {
                let parsedEvidence = []
                if (typeof evidence === 'string') {
                    if (evidence.startsWith('[')) parsedEvidence = JSON.parse(evidence)
                    else parsedEvidence = [evidence]
                } else if (Array.isArray(evidence)) parsedEvidence = evidence

                attachments = parsedEvidence.map((dataUrl, index) => {
                    const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
                    if (match) {
                        return {
                            name: `evidence_${index + 1}.jpg`,
                            content: match[2],
                            contentType: match[1],
                            cid: `evidence_${index + 1}`
                        }
                    }
                    return null
                }).filter(Boolean)
            }
        } catch (e) {
            console.error('Evidence parsing error in dispatchAuthority:', e)
        }

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
            ${attachments.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <strong>Attached Evidence:</strong><br/>
                <img src="cid:evidence_1" alt="Evidence" style="max-width: 100%; border-radius: 8px; border: 1px solid #374151; margin-top: 10px;" />
            </div>
            ` : ''}
        `
        const authorityFooter = `<p style="font-size: 0.85em; color: #6b7280; font-style: italic;">This is an automated notification sent to relevant authorities for intelligence purposes.</p>`
        const authorityHtml = EMAIL_TEMPLATE(`Automated Scam Report`, authorityHtmlContent, authorityFooter)

        if (authoritiesList.length > 0) {
            await sendSESEmail(env, {
                to: null, // Authorities should be BCC'd to protect their privacy from each other
                bcc: authoritiesList,
                subject: emailSubject,
                html: authorityHtml,
                from: 'CheckItSA Reports <no-reply@checkitsa.co.za>',
                attachments
            })
            console.log(`[Dispatch] Authority email sent to ${authoritiesList.join(', ')}`)
        }
        return true;
    } catch (e) {
        console.error("dispatchAuthority Error:", e)
        return false;
    }
}
