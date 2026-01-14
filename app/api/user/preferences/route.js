import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(request) {
    const { email, receive_security_intel } = await request.json()
    const { env } = getRequestContext()

    if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 })

    try {
        await env.DB.prepare(
            "UPDATE users SET receive_security_intel = ? WHERE email = ?"
        ).bind(receive_security_intel ? 1 : 0, email).run()

        return new Response(JSON.stringify({ success: true }), { status: 200 })
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 })
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const { env } = getRequestContext()

    if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 })

    try {
        const user = await env.DB.prepare(
            "SELECT receive_security_intel FROM users WHERE email = ?"
        ).bind(email).first()

        return new Response(JSON.stringify({ receive_security_intel: user?.receive_security_intel === 1 }), { status: 200 })
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 })
    }
}
