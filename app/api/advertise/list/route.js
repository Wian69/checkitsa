import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
    try {
        const db = req.context?.env?.DB || process.env.DB;

        if (!db) return NextResponse.json({ listings: [] });

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        let query = `SELECT id, business_name, website_url, description, category, logo_url, registration_number, images 
                 FROM listings 
                 WHERE status = 'active' AND expires_at > ?`;
        let params = [now];

        if (q) {
            query += ` AND (business_name LIKE ? OR category LIKE ? OR description LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT 20`;

        const { results } = await db.prepare(query).bind(...params).all();

        return NextResponse.json({ listings: results });

    } catch (error) {
        console.error('List Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
