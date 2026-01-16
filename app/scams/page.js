"use client"
import Navbar from '@/components/Navbar'
import CommunityReportsFeed from '@/components/CommunityReportsFeed'
import Link from 'next/link'

export default function WallOfShame() {
    return (
        <main className="min-h-screen pb-24">
            <Navbar />

            <div className="container pt-32 px-4 mx-auto max-w-6xl">
                {/* SEO Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-3 py-1 mb-4 text-sm rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                        🚨 Public Scam Database
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 font-outfit">
                        The Wall of Shame
                    </h1>
                    <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
                        A real-time index of confirmed scams reported by the South African community.
                        Search here before you pay.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Link href="/report" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-500/20">
                            Report a Scam
                        </Link>
                    </div>
                </div>

                {/* The Feed */}
                <CommunityReportsFeed />

                {/* SEO Footer Text */}
                <div className="mt-24 p-8 rounded-2xl bg-white/5 border border-white/10 text-center max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4 text-white">Why this list exists</h2>
                    <p className="text-white/60 leading-relaxed">
                        Every day, thousands of South Africans are targeted by fraud.
                        This public ledger ensures that once a scammer is identified, they cannot hide.
                        Google indexes every report here, making sure the next victim finds the warning
                        before it's too late.
                    </p>
                </div>
            </div>
        </main>
    )
}
