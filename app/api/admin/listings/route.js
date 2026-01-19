import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ADMIN_EMAIL = 'wiandurandt69@gmail.com';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        const { results } = await db.prepare(
            `SELECT * FROM listings ORDER BY created_at DESC`
        ).all();

        return NextResponse.json({ listings: results });
    } catch (error) {
        console.error('Admin Listings GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { email, id, status, expires_at } = await req.json();

        if (email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        if (status) {
            await db.prepare(
                `UPDATE listings SET status = ? WHERE id = ?`
            ).bind(status, id).run();
        }

        if (expires_at) {
            await db.prepare(
                `UPDATE listings SET expires_at = ? WHERE id = ?`
            ).bind(expires_at, id).run();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin Listings PATCH Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const id = searchParams.get('id');

        if (email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });

        await db.prepare(`DELETE FROM listings WHERE id = ?`).bind(id).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin Listings DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
