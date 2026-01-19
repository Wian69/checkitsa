
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req, { params }) {
    try {
        const id = params.id;
        const db = req.context?.env?.DB || process.env.DB;

        if (!db) {
            // Fallback for local dev without D1 binding
            return NextResponse.json({
                business: {
                    id: 999,
                    business_name: 'CheckItSA',
                    website_url: 'https://checkitsa.co.za',
                    description: 'South Africa\'s leading fraud prevention and verification platform.',
                    category: 'Security',
                    registration_number: '2024/CHECK/SA',
                    images: '["/partners/checkitsa_preview.png"]',
                    status: 'active'
                },
                products: []
            });
        }

        // 1. Fetch Business Details
        const business = await db.prepare(
            `SELECT id, business_name, website_url, description, category, logo_url, registration_number, images, status, created_at 
             FROM listings WHERE id = ? AND status = 'active'`
        ).bind(id).first();

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // 2. Fetch Business Products
        const { results: products } = await db.prepare(
            `SELECT * FROM listing_products WHERE listing_id = ? ORDER BY created_at DESC`
        ).bind(id).all();

        return NextResponse.json({
            business,
            products: products || []
        });

    } catch (error) {
        console.error('Business Profile API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
