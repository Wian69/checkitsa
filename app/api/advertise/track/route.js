import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
    try {
        const db = req.context?.env?.DB || process.env.DB;
        if (!db) return NextResponse.json({ error: 'DB not found' }, { status: 500 });

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.prepare('UPDATE listings SET click_count = click_count + 1 WHERE id = ?')
            .bind(id)
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
