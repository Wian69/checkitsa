export const runtime = 'edge'

export async function GET() {
    const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /verify-verification/
Sitemap: https://checkitsa.co.za/sitemap.xml`

    return new Response(robots, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=86400, mutable'
        }
    })
}
