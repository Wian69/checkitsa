import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ listings: [] });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        const { results } = await db.prepare(
            `SELECT * FROM listings WHERE user_email = ? ORDER BY created_at DESC`
        ).bind(email).all();

        return NextResponse.json({ listings: results });
    } catch (error) {
        console.error('User Listings GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
