
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
        if (!columns.includes('reviewer_email')) {
            await db.prepare("ALTER TABLE business_reviews ADD COLUMN reviewer_email TEXT").run()
        }
        if (!columns.includes('type')) {
            await db.prepare("ALTER TABLE business_reviews ADD COLUMN type TEXT DEFAULT 'business'").run()
        }
    } catch (e) {
        console.error('Schema Sync Error:', e)
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')
        const db = getRequestContext().env.DB
        await ensureSchema(db)

        let query = "SELECT * FROM business_reviews"
        let params = []

        if (email) {
            query += " WHERE reviewer_email = ?"
            params.push(email)
        }

        query += " ORDER BY created_at DESC LIMIT 50"
        const { results } = await db.prepare(query).bind(...params).all()
        return NextResponse.json({ reviews: results || [] })
    } catch (e) {
        return NextResponse.json({ reviews: [] }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const { businessName, businessEmail, rating, title, content, reviewerName, reviewerEmail, type = 'business' } = await req.json()
        const db = getRequestContext().env.DB
        await ensureSchema(db)

        if (!businessName || !rating || !content) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        const { success, meta } = await db.prepare(
            `INSERT INTO business_reviews (business_name, business_email, rating, title, content, reviewer_name, reviewer_email, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?)`
        ).bind(businessName, businessEmail || null, rating, title, content, reviewerName || 'Anonymous', reviewerEmail || null, type).run()

        if (success && businessEmail) {
            const newReviewId = meta.last_row_id
            const brevoApiKey = process.env.BREVO_API_KEY
            const resendApiKey = process.env.RESEND_API_KEY
            const baseUrl = 'https://checkitsa.co.za'

            const emailSubject = `⭐ New Business Review: ${businessName}`
            const emailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
                    <div style="background-color: #6366f1; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">CheckItSA Business Alert</h1>
                    </div>
                    <div style="padding: 30px; line-height: 1.6;">
                        <h2 style="color: #0f172a; margin-top: 0;">You've received a new review!</h2>
                        <p style="font-size: 16px;">Someone has just left feedback for <strong>${businessName}</strong> on CheckItSA.</p>
                        
                        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6366f1;">
                            <div style="color: #fbbf24; font-size: 20px; margin-bottom: 12px;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
                            <strong style="display: block; font-size: 18px; margin-bottom: 8px; color: #0f172a;">${title}</strong>
                            <p style="color: #475569; font-style: italic; margin: 0;">"${content}"</p>
                        </div>

                        <p>Transparent feedback helps build a safer community in South Africa. You can view this review and respond to the customer using the button below:</p>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${baseUrl}/reviews/respond?id=${newReviewId}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                Respond to Review →
                            </a>
                        </div>

                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; text-align: center;">
                            <p style="margin-bottom: 4px;"><strong>CheckItSA</strong> - Verified South African Business Intelligence</p>
                            <p style="margin-top: 0;">This is a transactional notification sent to ${businessEmail}.</p>
                            <div style="margin-top: 15px;">
                                <a href="https://checkitsa.co.za" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Website</a>
                                <a href="mailto:info@checkitsa.co.za" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Support</a>
                            </div>
                        </div>
                    </div>
                </div>
            `
            const emailText = `New Business Review: ${businessName}\n\nYou've received a ${rating}-star review on CheckItSA.\n\nTitle: ${title}\n"${content}"\n\nRespond to this review here: ${baseUrl}/reviews/respond?id=${newReviewId}\n\nCheckItSA - Verified South African Business Intelligence`

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
                            from: 'CheckItSA Reviews <info@checkitsa.co.za>',
                            to: businessEmail,
                            reply_to: 'info@checkitsa.co.za',
                            subject: emailSubject,
                            html: emailHtml,
                            text: emailText
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

export async function DELETE(req) {
    try {
        const { id, email } = await req.json()
        const db = getRequestContext().env.DB

        if (!id || !email) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        const { success } = await db.prepare(
            "DELETE FROM business_reviews WHERE id = ? AND reviewer_email = ?"
        ).bind(id, email).run()

        if (!success) throw new Error('Deletion failed or unauthorized')

        return NextResponse.json({ message: 'Review deleted' })
    } catch (e) {
        return NextResponse.json({ message: e.message }, { status: 500 })
    }
}
