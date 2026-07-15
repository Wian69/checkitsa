import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const body = await req.json()
        const { token, message } = body

        if (!token || !message) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
        }

        const env = getRequestContext().env

        // 1. Simple Security Check
        const adminSecret = env.ADMIN_SECRET || 'secret'
        if (token !== adminSecret) {
            return NextResponse.json({ success: false, error: 'Unauthorized - Invalid Admin Token' }, { status: 403 })
        }

        // 2. Facebook Integration
        const fbToken = env.FB_PAGE_ACCESS_TOKEN;
        const fbPageId = env.FB_PAGE_ID;

        if (!fbToken || !fbPageId) {
            return NextResponse.json({ success: false, error: 'Missing Facebook Credentials in Cloudflare' }, { status: 500 })
        }

        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/feed`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${fbToken}`
            },
            body: JSON.stringify({
                message: message,
                link: 'https://checkitsa.co.za/'
            })
        });

        if (!fbRes.ok) {
            const errStr = await fbRes.text()
            console.error("Facebook API rejected the post:", errStr);
            return NextResponse.json({ success: false, error: `Facebook API Error: ${errStr}` }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Successfully posted to Facebook!' })

    } catch (error) {
        console.error("Manual Facebook Post Error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
