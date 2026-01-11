export const runtime = 'edge'

export function GET() {
    return new Response(JSON.stringify({ status: 'ok', msg: 'bare response' }), {
        headers: { 'Content-Type': 'application/json' }
    })
}
