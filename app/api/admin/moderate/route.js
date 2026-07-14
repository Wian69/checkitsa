import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'
import { dispatchAuthority } from '@/app/lib/dispatchAuthority'

export const runtime = 'edge'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const action = searchParams.get('action')
        const token = searchParams.get('token')
        const db = getRequestContext().env.DB

        // 1. Simple Security Check
        const adminSecret = process.env.ADMIN_SECRET || 'secret'
        if (token !== adminSecret) {
            return new Response('Unauthorized - Invalid Token', { status: 403 })
        }

        if (!id || !action) return new Response('Missing parameters', { status: 400 })

        // 2. Perform Action
        if (action === 'verify') {
            await db.prepare("UPDATE scam_reports SET status = 'verified' WHERE id = ?").bind(id).run()

            // START AUTHORITY NOTIFICATION LOGIC
            await dispatchAuthority(getRequestContext().env, db, id);
            // END AUTHORITY NOTIFICATION

            return new Response(`
                <html>
                    <head><title>Verified</title></head>
                    <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
                        <h1 style="color: green;">✅ Report Verified</h1>
                        <p>The report has been marked as verified and <strong>sent to authorities</strong>.</p>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 1rem; cursor: pointer;">Close Window</button>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } })
        }

        if (action === 'reject') {
            await db.prepare("UPDATE scam_reports SET status = 'rejected' WHERE id = ?").bind(id).run()
            return new Response(`
                <html>
                    <head><title>Rejected</title></head>
                    <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
                        <h1 style="color: #666;">❌ Report Rejected</h1>
                        <p>The report has been rejected and hidden from the public feed.</p>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 1rem; cursor: pointer;">Close Window</button>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } })
        }

        return new Response('Invalid Action', { status: 400 })

    } catch (error) {
        return new Response('Error: ' + error.message, { status: 500 })
    }
}
