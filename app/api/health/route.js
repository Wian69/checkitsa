import { NextResponse } from 'next/server'

export const runtime = 'edge'

export function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            has_keys: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY
        }
    })
}
