
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ADMIN_EMAIL = 'wiandurandt69@gmail.com';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        // Security Check
        if (email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        // Check if already exists
        const existing = await db.prepare("SELECT id FROM listings WHERE business_name = 'CheckItSA'").first();
        if (existing) {
            return NextResponse.json({ message: 'CheckItSA ad already exists!', id: existing.id });
        }

        // Insert
        const { lastRowId } = await db.prepare(`
            INSERT INTO listings (
                user_email, 
                business_name, 
                website_url, 
                description, 
                category, 
                registration_number, 
                images, 
                status, 
                amount_paid, 
                expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            ADMIN_EMAIL,
            'CheckItSA',
            'https://checkitsa.co.za',
            'South Africa\'s leading fraud prevention and verification platform. We empower citizens with tools to verify businesses, detect scams, and report fraudulent activity in real-time.',
            'Security',
            '2024/CHECK/SA',
            JSON.stringify(["/partners/checkitsa_preview.png", "/partners/checkitsa_mobile.png"]),
            'active',
            0.0,
            '2099-12-31 23:59:59'
        ).run();

        return NextResponse.json({
            success: true,
            message: 'CheckItSA listing seeded successfully',
            id: lastRowId
        });

    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
