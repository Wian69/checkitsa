import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
    try {
        const { listingId, token } = await req.json();
        const db = req.context?.env?.DB || process.env.DB;
        const secretKey = process.env.YOCO_SECRET_KEY;

        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        // 1. Verify payment with Yoco
        const yocoRes = await fetch('https://online.yoco.com/v1/charges/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                amountInCents: 15000,
                currency: 'ZAR'
            })
        });

        const yocoData = await yocoRes.json();

        if (yocoRes.status !== 201 || yocoData.status !== 'successful') {
            return NextResponse.json({ error: 'Payment failed with Yoco' }, { status: 400 });
        }

        // 2. Update listing status in database as active for 30 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const expiresAt = expiryDate.toISOString().replace('T', ' ').slice(0, 19);

        await db.prepare(
            `UPDATE listings 
       SET status = 'active', 
           payment_ref = ?, 
           amount_paid = ?, 
           expires_at = ? 
       WHERE id = ?`
        ).bind(yocoData.id, 150, expiresAt, listingId).run();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Payment Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
