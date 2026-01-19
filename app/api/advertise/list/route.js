import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
    try {
        const db = req.context?.env?.DB || process.env.DB;

        if (!db) {
            // Fallback for local dev without D1 binding
            return NextResponse.json({
                listings: [{
                    id: 999,
                    business_name: 'CheckItSA',
                    website_url: 'https://checkitsa.co.za',
                    description: 'South Africa\'s leading fraud prevention and verification platform. We empower citizens with tools to verify businesses, detect scams, and report fraudulent activity in real-time. Join our community in building a safer digital South Africa.',
                    category: 'Security',
                    registration_number: '2024/CHECK/SA',
                    images: '["/partners/checkitsa_preview.png", "/partners/checkitsa_mobile.png"]',
                    click_count: 0
                }]
            });
        }

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
