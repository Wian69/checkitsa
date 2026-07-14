import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const body = await req.json()
        const { email, password, url, isAutoScan } = body

        if (!email || !password || !url) {
            return NextResponse.json({ success: false, message: 'Missing credentials or URL' }, { status: 400 })
        }

        const env = getRequestContext().env
        const db = env.DB

        // 1. Authenticate User
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
        
        if (!user || user.password !== password) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 })
        }

        // 2. Enforce Limits (Auto-scans are only for Premium, but ALL scans deduct from the quota)
        if (isAutoScan && user.tier === 'free') {
            return NextResponse.json({ success: false, message: 'Auto-scan is a Premium feature' }, { status: 403 })
        }
        
        // Enforce exact tier limits and deduct for EVERY scan (manual or auto)
        const limit = user.tier === 'elite' || user.tier === 'custom' ? 5000 : (user.tier === 'pro' ? 1000 : 5)
        if (user.searches >= limit) {
            return NextResponse.json({ 
                success: false, 
                message: `Limit exceeded. Your plan includes ${limit} deep scans.`,
                limitReached: true,
                tier: user.tier 
            }, { status: 403 })
        }
        // Deduct Quota
        await db.prepare('UPDATE users SET searches = searches + 1 WHERE email = ?').bind(email).run()
        user.searches += 1

        // 4. Perform the exact same scan as the main website
        const scanUrl = new URL('/api/scan', req.url).href
        const scanRes = await fetch(scanUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: url })
        })

        if (!scanRes.ok) {
             return NextResponse.json({ success: false, message: 'Scan engine failed' }, { status: 500 })
        }

        const scanData = await scanRes.json()

        return NextResponse.json({
            success: true,
            data: scanData,
            scansUsed: user.searches,
            limit: user.tier === 'elite' || user.tier === 'custom' ? 5000 : (user.tier === 'pro' ? 1000 : 5)
        })

    } catch (e) {
        console.error('Extension Scan Error:', e)
        return NextResponse.json({ success: false, message: e.message }, { status: 500 })
    }
}
