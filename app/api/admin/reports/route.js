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
            `SELECT * FROM reports ORDER BY created_at DESC`
        ).all();

        return NextResponse.json({ reports: results });
    } catch (error) {
        console.error('Admin Reports GET Error:', error);
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

        await db.prepare(`DELETE FROM reports WHERE id = ?`).bind(id).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin Reports DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
