
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Secret key to prevent unauthorized execution (User should set this in env vars)
const CRON_SECRET = process.env.CRON_SECRET || 'checkitsa_cron_secret';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (key !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        // 1. Find Expired Active Ads
        // We look for ads that are 'active' but their expires_at date is in the past
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        const { results: expiredAds } = await db.prepare(
            `SELECT id, user_email, business_name 
             FROM listings 
             WHERE status = 'active' AND expires_at < ?`
        ).bind(now).all();

        if (!expiredAds || expiredAds.length === 0) {
            return NextResponse.json({ message: 'No ads expired today.' });
        }

        // 2. Process Expirations
        const updates = [];
        const emails = [];

        for (const ad of expiredAds) {
            // Update Status to 'expired'
            updates.push(
                db.prepare(`UPDATE listings SET status = 'expired' WHERE id = ?`).bind(ad.id)
            );

            // Prepare Email Notification
            // We'll hit the invite API logic or use a helper function. 
            // For now, let's just log it. sending emails in a loop in an edge function can be tricky with timeouts.
            // Ideally, we'd queue these. For MVP, we will try to send them or at least return them.
            emails.push({ email: ad.user_email, business: ad.business_name });
        }

        // Execute DB Updates in Batch
        if (updates.length > 0) {
            await db.batch(updates);
        }

        // 3. Send Emails (Using Brevo - simplified version or call another API)
        // Since we can't easily import the invite logic without refactoring, we'll do a simple fetch here if possible or just log.
        // Given the context, I will create a simple email sender helper or just leave a TODO for the email API integration if complex.
        // BUT user specifically requested email. So I will initiate the email send here.

        const results = await Promise.allSettled(emails.map(async (item) => {
            return sendExpiryEmail(item.email, item.business);
        }));

        return NextResponse.json({
            success: true,
            expired_count: expiredAds.length,
            ads: expiredAds,
            email_results: results
        });

    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function sendExpiryEmail(to, businessName) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return "No API Key";

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'CheckItSA', email: 'checkitsa@gmail.com' }, // Use a verified sender
            to: [{ email: to }],
            subject: `Action Required: Your CheckItSA listing for ${businessName} has expired`,
            htmlContent: `
                <h1>Your Listing Has Expired</h1>
                <p>Hello,</p>
                <p>Your verified listing for <strong>${businessName}</strong> has completed its 30-day cycle.</p>
                <p>To keep your "Verified" badge and maintain your position in our search results, please renew your listing.</p>
                <p><strong>Your products and profile details have been saved.</strong> You just need to reactivate the ad.</p>
                <br/>
                <a href="https://checkitsa.co.za/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"> Renew Now (R99)</a>
                <br/><br/>
                <p>Stay Safe,<br/>The CheckItSA Team</p>
            `
        })
    });
    return response.ok;
}
