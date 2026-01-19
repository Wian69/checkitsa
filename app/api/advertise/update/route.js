import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { listingId, email, business_name, website_url, description, category, registration_number } = await request.json()

        if (!listingId || !email) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
        }

        const { env } = getRequestContext()
        const db = env.DB

        // 1. Verify Ownership
        const existing = await db.prepare("SELECT * FROM listings WHERE id = ? AND user_email = ?")
            .bind(listingId, email)
            .first()

        if (!existing) {
            return new Response(JSON.stringify({ error: 'Listing not found or unauthorized' }), { status: 403 })
        }

        // 2. Update Listing
        await db.prepare(`
            UPDATE listings 
            SET business_name = ?, website_url = ?, description = ?, category = ?, registration_number = ?
            WHERE id = ?
        `).bind(business_name, website_url, description, category, registration_number, listingId).run()

        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 })
    }
}
