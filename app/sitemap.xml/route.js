export const runtime = 'edge'

export async function GET() {
    const baseUrl = 'https://checkitsa.co.za'
    const date = new Date().toISOString()

    const urls = [
        { loc: baseUrl, changefreq: 'daily', priority: '1.0' },
        { loc: `${baseUrl}/reviews`, changefreq: 'hourly', priority: '0.9' },
        { loc: `${baseUrl}/affiliate`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.5' },
        { loc: `${baseUrl}/contact`, changefreq: 'yearly', priority: '0.5' },
        { loc: `${baseUrl}/privacy`, changefreq: 'yearly', priority: '0.3' },
        { loc: `${baseUrl}/terms`, changefreq: 'yearly', priority: '0.3' }
    ]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
    <url>
        <loc>${url.loc}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
    </url>
    `).join('')}
</urlset>`

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400, mutable'
        }
    })
}
