
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { sendSESEmail } from '@/app/lib/mailer'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

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

        if (searchParams.get('distinct')) {
            const { results } = await db.prepare("SELECT business_name as name, business_email as email FROM business_reviews WHERE business_email IS NOT NULL AND business_email != '' GROUP BY business_name ORDER BY business_name ASC").all()
            return NextResponse.json({ businesses: results })
        }

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

        if (success && (businessEmail || type === 'ccma')) {
            const newReviewId = meta.last_row_id
            const baseUrl = 'https://checkitsa.co.za'

            // Determine Recipients
            let recipients = []
            if (businessEmail) recipients.push(businessEmail)
            if (type === 'ccma') recipients.push('complaints@ccma.org.za')

            // If no recipients, skip
            if (recipients.length === 0) return NextResponse.json({ message: 'Review submitted (no notifications sent)' })

            let emailSubject = ''
            let emailHtmlContent = ''

            if (type === 'complaint') {
                emailSubject = `🚨 OFFICIAL COMPLAINT FILED: ${businessName}`
                emailHtmlContent = `
                    <div style="background-color: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 22px;">CheckItSA - Official Complaint</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ef4444; border-top: none; border-radius: 0 0 8px 8px; background-color: #fff; color: #1f2937;">
                        <p><strong>Attention: ${businessName} Complaints Department</strong></p>
                        <p>A severe customer complaint has been filed against your business on the CheckItSA public registry.</p>
                        
                        <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
                            <strong style="font-size: 18px; color: #b91c1c;">${title}</strong>
                            <p style="margin-top: 10px;">"${content}"</p>
                            <p style="margin-top: 10px; font-size: 12px; color: #7f1d1d;">Rating: ${rating}/5 Stars</p>
                        </div>
                        
                        <p><strong>Customer Contact:</strong> ${reviewerName} (${reviewerEmail})</p>
                        <p>You can officially respond to this complaint to have your response displayed publicly next to it:</p>
                        <a href="${baseUrl}/reviews/respond?id=${newReviewId}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Respond & Resolve Complaint →</a>
                    </div>
                `
            } else if (type === 'ccma') {
                emailSubject = `⚖️ New CCMA Case Report: ${businessName}`
                emailHtmlContent = `
                    <p>A new CCMA case has been reported on CheckItSA for <strong>${businessName}</strong>.</p>
                    <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #6366f1;">
                        <strong>${title}</strong>
                        <p>"${content}"</p>
                    </div>
                    <a href="${baseUrl}/reviews/respond?id=${newReviewId}">Respond to Case</a>
                `
            } else {
                emailSubject = `⭐ New Customer Review: ${businessName}`
                emailHtmlContent = `
                    <p>Someone has just left public feedback for <strong>${businessName}</strong> on CheckItSA.</p>
                    <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #6366f1; border-radius: 4px;">
                        <div style="color: #fbbf24; font-size: 20px; margin-bottom: 10px;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
                        <strong style="font-size: 18px;">${title}</strong>
                        <p>"${content}"</p>
                    </div>
                    <p>Customer: ${reviewerName} (${reviewerEmail})</p>
                    <a href="${baseUrl}/reviews/respond?id=${newReviewId}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Respond to Customer →</a>
                `
            }

            // Fallback for CCMA which didn't use the standard layout
            const finalHtml = (type === 'complaint') ? emailHtmlContent : EMAIL_TEMPLATE(emailSubject, emailHtmlContent, `<p>This is an automated notification from CheckItSA.</p>`)

            const env = getRequestContext().env;
            const apiKey = env?.SMTP2GO_API_KEY || (typeof process !== 'undefined' ? process.env.SMTP2GO_API_KEY : null);

            if (apiKey && recipients.length > 0) {
                try {
                    await fetch('https://api.smtp2go.com/v3/email/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            api_key: apiKey,
                            sender: 'info@checkitsa.co.za',
                            to: recipients,
                            subject: emailSubject,
                            html_body: finalHtml
                        })
                    });
                } catch (e) {
                    console.error("Reviews Email Error:", e);
                }
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
