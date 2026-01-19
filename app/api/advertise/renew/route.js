
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
    try {
        const { listingId, token } = await req.json();

        if (!listingId || !token) {
            return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
        }

        // Verify Payment with Yoco
        const yocoRes = await fetch(`https://online.yoco.com/v1/charges/`, {
            method: 'POST',
            headers: {
                'X-Auth-Secret-Key': process.env.YOCO_SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                amountInCents: 9900, // R99.00 Renewal
                currency: 'ZAR'
            })
        });

        const yocoData = await yocoRes.json();

        if (!yocoRes.ok || yocoData.status !== 'successful') {
            return NextResponse.json({ error: 'Payment failed' }, { status: 400 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        // Calculate New Expiry (Now + 30 Days)
        const now = new Date();
        now.setDate(now.getDate() + 30);
        const newExpiry = now.toISOString().replace('T', ' ').slice(0, 19);

        // Update Listing Status and Expiry
        await db.prepare(
            `UPDATE listings 
             SET status = 'active', expires_at = ?, amount_paid = amount_paid + 99, payment_ref = ?
             WHERE id = ?`
        ).bind(newExpiry, yocoData.id, listingId).run();

        return NextResponse.json({ success: true, new_expiry: newExpiry });

    } catch (error) {
        console.error('Renewal Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
