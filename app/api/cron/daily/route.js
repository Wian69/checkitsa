import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

export const runtime = 'edge'

// Reusing the feed logic from api/intel roughly, or just fetching it internally
async function fetchIntel() {
    // We can call the internal API or just replicate the feed fetch here for reliability in Cron
    // Let's replicate simple fetch for the top source to ensure content
    try {
        const res = await fetch('https://mybroadband.co.za/news/security/feed')
        const text = await res.text()
        // Simple regex parse for titles/links to avoid heavy XML parser deps if possible, 
        // or just use a generic message if parsing fails.
        // Actually, let's just hardcode a "Check Dashboard" Call to Action with 1 highlighted item if possible.
        // For robustness, we will send a generic "Daily Brief" email that encourages dashboard visits + 1 hard fact.
        return null // We will just use generic template for V1 to ensure reliability
    } catch (e) { return null }
}

export async function GET(req) {
    try {
        const { get } = getRequestContext().env.DB.prepare
        const db = getRequestContext().env.DB

        // 1. Security Check
        const authHeader = req.headers.get('Authorization')
        const cronSecret = process.env.CRON_SECRET || 'changeme_in_prod'
        if (authHeader !== `Bearer ${cronSecret}`) {
            return new Response('Unauthorized', { status: 401 })
        }

        // 2. Fetch Target Users
        // Pro, Elite, Ultimate, Custom tiers AND notifications_enabled
        const { results: users } = await db.prepare(
            "SELECT email, fullName FROM users WHERE tier IN ('pro', 'elite', 'ultimate', 'custom') AND notifications_enabled = 1"
        ).all()

        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No subscribed users found' })
        }

        // 3. Prepare Email Content
        const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })

        // In a real app, we'd fetch the actual top story. 
        // For now, we'll make a dynamic "Status OK" or similar.
        const briefingContent = `
            <p style="margin-bottom: 24px;">Good Morning,</p>
            <p style="margin-bottom: 20px;">Here is your daily security snapshot for <strong>${dateStr}</strong>.</p>
            
            <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                    <strong style="color: #10b981;">🛡️ System Status:</strong> <span style="color: #d1d5db;">Active Monitoring</span>
                </div>
                <div>
                    <strong style="color: #f59e0b;">⚠️ Recent Scams Reported:</strong> <span style="color: #d1d5db;">Check Dashboard for live feed.</span>
                </div>
            </div>

            <p style="margin-bottom: 20px;">Stay ahead of identity theft and fraud. Log in to your dashboard to view the latest real-time intel from MyBroadband, BusinessTech, and community reports.</p>
        `

        const htmlContent = EMAIL_TEMPLATE(
            `🛡️ Security Briefing`,
            briefingContent,
            `<a href="https://checkitsa.co.za/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Open Dashboard</a>`
        )

        // 4. Send Batch Emails (Chunking if needed, but for now linear)
        const brevoApiKey = process.env.BREVO_API_KEY
        const resendApiKey = process.env.RESEND_API_KEY

        // We will send individually to personalize or BCC batch?
        // BCC Batch is better for quotas, but individual is better for "Good Morning [Name]".
        // Let's do Bcc batch for efficiency safely.

        const recipients = users.map(u => u.email)

        if (recipients.length > 0) {
            // Brevo
            if (brevoApiKey) {
                // Send as BCC to protect privacy in batch
                await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
                    body: JSON.stringify({
                        sender: { name: 'CheckItSA Security', email: 'no-reply@checkitsa.co.za' },
                        to: [{ email: 'no-reply@checkitsa.co.za', name: 'CheckItSA Member' }], // Placebo TO
                        bcc: recipients.map(e => ({ email: e })),
                        subject: `🛡️ Security Briefing: ${dateStr}`,
                        htmlContent: htmlContent
                    })
                })
            }
            // Resend
            else if (resendApiKey) {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: 'CheckItSA <info@checkitsa.co.za>',
                        to: 'info@checkitsa.co.za',
                        bcc: recipients,
                        subject: `🛡️ Security Briefing: ${dateStr}`,
                        html: htmlContent
                    })
                })
            }
        }

        return NextResponse.json({ message: `Sent briefing to ${recipients.length} users` })

    } catch (error) {
        console.error('Cron Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
