import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const action = searchParams.get('action')
        const token = searchParams.get('token')
        const db = getRequestContext().env.DB

        // 1. Simple Security Check
        // In a real app, 'token' should be a signed JWT or hash. 
        // For MVP, we'll check if the ID matches a pending report and maybe a hardcoded admin secret if available,
        // or just rely on the obscurity of the link sent to the admin email.
        const adminSecret = process.env.ADMIN_SECRET || 'secret' // Fallback
        if (token !== adminSecret) {
            return new Response('Unauthorized - Invalid Token', { status: 403 })
        }

        if (!id || !action) return new Response('Missing parameters', { status: 400 })

        // 2. Perform Action
        if (action === 'verify') {
            await db.prepare("UPDATE scam_reports SET status = 'verified' WHERE id = ?").bind(id).run()
            return new Response('✅ Report VERIFIED successfully. You can close this window.', { status: 200 })
        }

        if (action === 'reject') {
            await db.prepare("UPDATE scam_reports SET status = 'rejected' WHERE id = ?").bind(id).run()
            return new Response('❌ Report REJECTED/DELETED. You can close this window.', { status: 200 })
        }

        return new Response('Invalid Action', { status: 400 })

    } catch (error) {
        return new Response('Error: ' + error.message, { status: 500 })
    }
}
