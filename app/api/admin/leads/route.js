import { NextResponse } from 'next/server';

export const runtime = 'edge';

// GET: Fetch all leads (Admin Only)
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email'); // requester email

        // Simple Admin Check logic (should be robust in prod)
        if (email !== 'wiandurandt69@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = req.context?.env?.DB || process.env.DB;

        // Ensure table exists (lazy migration for dev speed)
        try {
            await db.prepare("SELECT 1 FROM leads LIMIT 1").first();
        } catch (e) {
            console.log("Creating leads table...");
            await db.prepare(`
                CREATE TABLE IF NOT EXISTS leads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    business_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    source TEXT DEFAULT 'Manual',
                    status TEXT DEFAULT 'New',
                    last_contacted_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `).run();
        }

        const { results } = await db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();

        return NextResponse.json({ leads: results || [] });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add new lead(s)
export async function POST(req) {
    try {
        const body = await req.json(); // Expects { email: 'admin...', lead: { ... } }
        const { email, lead } = body;

        if (email !== 'wiandurandt69@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = req.context?.env?.DB || process.env.DB;

        // Dedup check
        const existing = await db.prepare("SELECT id FROM leads WHERE email = ?").bind(lead.email).first();
        if (existing) {
            return NextResponse.json({ error: 'Lead already exists' }, { status: 409 });
        }

        await db.prepare(
            "INSERT INTO leads (business_name, email, source, status) VALUES (?, ?, ?, ?)"
        ).bind(lead.business_name, lead.email, lead.source || 'Manual', 'New').run();

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update status (e.g. mark as Contacted)
export async function PATCH(req) {
    try {
        const body = await req.json();
        const { email, leadId, status, contacted } = body;

        if (email !== 'wiandurandt69@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = req.context?.env?.DB || process.env.DB;

        let query = "UPDATE leads SET status = ?";
        let bindParams = [status];

        if (contacted) {
            query += ", last_contacted_at = CURRENT_TIMESTAMP";
        }

        query += " WHERE id = ?";
        bindParams.push(leadId);

        await db.prepare(query).bind(...bindParams).run();

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
