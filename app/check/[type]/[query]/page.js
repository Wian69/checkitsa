import { getRequestContext } from '@cloudflare/next-on-pages'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const runtime = 'edge'

export async function generateMetadata({ params }) {
    const { type, query } = params
    const decodedQuery = decodeURIComponent(query)

    return {
        title: `Is ${decodedQuery} a Scam? | CheckItSA Report`,
        description: `Read verified fraud reports and reviews about ${decodedQuery}. Check if ${decodedQuery} is safe or a known scam on CheckItSA.`,
        openGraph: {
            title: `Is ${decodedQuery} a Scam?`,
            description: `We found potential fraud reports matching ${decodedQuery}. Click to see the evidence.`,
        }
    }
}

async function getReports(query) {
    try {
        const db = getRequestContext().env.DB
        const search = `%${decodeURIComponent(query)}%`

        // Search in scammer_details (number/url) AND description
        const results = await db.prepare(`
            SELECT * FROM scam_reports 
            WHERE (scammer_details LIKE ? OR description LIKE ?)
            AND status = 'verified' 
            ORDER BY created_at DESC 
            LIMIT 50
        `)
            .bind(search, search)
            .all()

        return results.results || []
    } catch (e) {
        console.error("DB Error", e)
        return []
    }
}

export default async function CheckPage({ params }) {
    const { type, query } = params
    const decodedQuery = decodeURIComponent(query)
    const reports = await getReports(query)

    return (
        <main className="min-h-screen pb-24">
            <Navbar />

            <div className="container pt-40 px-4 mx-auto max-w-4xl">
                {/* SEO Header */}
                <div className="text-center mb-12">
                    <div className="inline-block px-3 py-1 mb-4 text-sm rounded-full bg-white/10 border border-white/10 text-emerald-400">
                        🛡️ Public Safety Report
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Is <span className="text-red-400">{decodedQuery}</span> a Scam?
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        We searched our national fraud database for reports matching this {type === 'phone' ? 'phone number' : 'website'}.
                    </p>
                </div>

                {/* Verdict Card */}
                <div className="glass-panel p-8 mb-12 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-semibold mb-2">Verdict Analysis</h2>
                            <p className="text-white/60">
                                Based on {reports.length} verified reports
                            </p>
                        </div>
                        <div className={`px-6 py-3 rounded-xl text-xl font-bold ${reports.length > 0 ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'}`}>
                            {reports.length > 0 ? '⚠️ High Risk Detected' : '✅ No Reports Found'}
                        </div>
                    </div>
                </div>

                {/* Reports Feed */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <span>📋</span> Recent Community Reports
                    </h3>

                    {reports.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10 border-dashed">
                            <p className="text-white/40 text-lg mb-4">No public reports found matching this query yet.</p>
                            <Link href="/report" className="btn btn-primary">
                                Submit a Report
                            </Link>
                        </div>
                    ) : (
                        reports.map(report => (
                            <div key={report.id} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {report.scam_type?.includes('Bank') ? '🏦' : '⚠️'}
                                        </span>
                                        <div>
                                            <div className="font-semibold">{report.scam_type}</div>
                                            <div className="text-sm text-white/50">{new Date(report.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    {report.status === 'verified' && (
                                        <span className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/80 mb-4 font-mono text-sm bg-black/20 p-3 rounded">
                                    "{report.description}"
                                </p>
                                <div className="flex gap-2">
                                    {/* Placeholder for Viral Gate (Blur) */}
                                    {report.evidence_image && (
                                        <div className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">
                                            📎 Evidence Attached
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Call to Action */}
                <div className="mt-16 text-center border-t border-white/10 pt-12">
                    <h3 className="text-2xl font-bold mb-4">Have you been targeted?</h3>
                    <p className="text-white/60 mb-8">Your report helps protect thousands of South Africans.</p>
                    <Link href="/report" className="btn btn-primary text-lg px-8 py-3">
                        File a Report Now
                    </Link>
                </div>
            </div>
        </main>
    )
}
