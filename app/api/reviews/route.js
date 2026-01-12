
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

async function ensureSchema(db) {
    try {
        // Create table if not exists
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

        // Check columns
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

export async function GET() {
    try {
        const db = getRequestContext().env.DB
        await ensureSchema(db)
        const { results } = await db.prepare("SELECT * FROM business_reviews ORDER BY created_at DESC LIMIT 10").all()
        return NextResponse.json({ reviews: results || [] })
    } catch (e) {
        return NextResponse.json({ reviews: [] }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const { businessName, businessEmail, rating, title, content, reviewerName } = await req.json()
        const db = getRequestContext().env.DB
        await ensureSchema(db)

        if (!businessName || !rating || !content) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        const { success } = await db.prepare(
            `INSERT INTO business_reviews (business_name, business_email, rating, title, content, reviewer_name, status) VALUES (?, ?, ?, ?, ?, ?, 'verified')`
        ).bind(businessName, businessEmail || null, rating, title, content, reviewerName || 'Anonymous').run()

        if (success && businessEmail) {
            const brevoApiKey = process.env.BREVO_API_KEY
            const resendApiKey = process.env.RESEND_API_KEY
            const baseUrl = 'https://checkitsa.co.za'

            const emailSubject = `⭐ New Business Review: ${businessName}`
            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <img src="${baseUrl}/email-banner.png" alt="CheckItSA" style="width: 100%; display: block;" />
                    <div style="padding: 30px;">
                        <h2 style="color: #333;">You've received a new review!</h2>
                        <p style="color: #666; font-size: 16px;">Someone has just left feedback for <strong>${businessName}</strong> on CheckItSA.</p>
                        
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
                            <div style="color: #fbbf24; font-size: 20px; margin-bottom: 10px;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
                            <strong style="display: block; font-size: 18px; margin-bottom: 5px;">${title}</strong>
                            <p style="color: #444; font-style: italic; margin: 0;">"${content}"</p>
                        </div>

                        <p style="color: #666;">Sharing transparent feedback helps build a safer community. Would you like to view this review and leave a response?</p>
                        
                        <a href="${baseUrl}/reviews" style="display: inline-block; background: #6366f1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
                            Respond to Review →
                        </a>

                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 14px; line-height: 1.6;">
                            <strong>CheckItSA</strong><br/>
                            🌐 Website: <a href="https://checkitsa.co.za" style="color: #6366f1; text-decoration: none;">checkitsa.co.za</a><br/>
                            🛡️ Security Alert: Verify before you trust.
                        </div>
                    </div>
                </div>
            `

            let sentEmail = false

            // TRY BREVO
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
                            sender: { name: 'CheckItSA Reviews', email: 'info@checkitsa.co.za' },
                            to: [{ email: businessEmail }],
                            subject: emailSubject,
                            htmlContent: emailHtml
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
                            from: 'CheckItSA Reviews <onboarding@resend.dev>',
                            to: businessEmail,
                            subject: emailSubject,
                            html: emailHtml
                        })
                    })
                } catch (e) { console.error('Resend Error:', e) }
            }
        }

        if (!success) throw new Error('DB Insert Failed')

        return NextResponse.json({ message: 'Review submitted' })
    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
