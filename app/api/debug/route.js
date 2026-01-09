import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET() {
    try {
        const ctx = getRequestContext()
        const env = ctx.env
        const hasDB = !!env.DB

        // Try simple query if DB exists
        let dbStatus = 'Not Connected'
        let tableStatus = 'Unknown'

        if (hasDB) {
            dbStatus = 'Connected'
            try {
                const count = await env.DB.prepare('SELECT count(*) as c FROM users').first()
                tableStatus = `Users Table Found (Rows: ${count.c})`
            } catch (e) {
                tableStatus = `Query Failed: ${e.message}`
            }
        }

        return NextResponse.json({
            status: 'ok',
            runtime: 'edge',
            bindings: {
                hasDB,
                dbStatus,
                tableStatus
            },
            envKeys: Object.keys(env || {})
        })
    } catch (e) {
        return NextResponse.json({
            status: 'error',
            message: e.message,
            stack: e.stack
        }, { status: 500 })
    }
}
