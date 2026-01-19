import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
    try {
        const { businessName, websiteUrl, description, category, logoUrl } = await req.json();
        const db = req.context?.env?.DB || process.env.DB;

        if (!db) {
            // Support for local development if DB is not in context
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { lastRowId } = await db.prepare(
            `INSERT INTO listings (business_name, website_url, description, category, logo_url, status) 
       VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(businessName, websiteUrl, description, category, logoUrl, 'unpaid').run();

        return NextResponse.json({
            success: true,
            listingId: lastRowId,
            amount: 150
        });

    } catch (error) {
        console.error('Submission Error:', error);
        return NextResponse.json({ error: 'Could not save submission' }, { status: 500 });
    }
}
