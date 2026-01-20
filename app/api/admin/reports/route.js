import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const ADMIN_EMAIL = 'wiandurandt69@gmail.com';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = getRequestContext().env.DB;

        // Fetch ALL reports (Pending, Verified, Rejected) for moderation
        const { results } = await db.prepare(
            `SELECT * FROM scam_reports ORDER BY created_at DESC`
        ).all();

        return NextResponse.json({ reports: results });
    } catch (error) {
        console.error('Admin Reports GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { id, action, email } = await req.json();

        // 1. Auth Check (Must be admin)
        if (email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = getRequestContext().env.DB;

        // 2. Perform Action
        let status = '';
        if (action === 'verify') status = 'verified';
        else if (action === 'reject') status = 'rejected';
        else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

        await db.prepare("UPDATE scam_reports SET status = ? WHERE id = ?")
            .bind(status, id)
            .run();

        return NextResponse.json({ success: true, status });

    } catch (error) {
        console.error('Admin Moderate Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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

        const db = getRequestContext().env.DB;

        await db.prepare(`DELETE FROM scam_reports WHERE id = ?`).bind(id).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin Reports DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
