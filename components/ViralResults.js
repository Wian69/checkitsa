"use client"

import { useState, useEffect } from 'react'

export default function ViralResults({ reports, query, type }) {
    const [isUnlocked, setIsUnlocked] = useState(false)
    const storageKey = `checkitsa_unlocked_${query}`

    useEffect(() => {
        // Check if already unlocked locally
        if (localStorage.getItem(storageKey)) {
            setIsUnlocked(true)
        }
    }, [storageKey])

    const handleUnlock = () => {
        // 1. Open WhatsApp
        const url = `https://checkitsa.co.za/check/${type}/${query}`
        const msg = `⚠️ checkitsa.co.za Report: I just checked ${query}. See the scam report here: ${url}`
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')

        // 2. Unlock content (Optimistic unlock)
        localStorage.setItem(storageKey, 'true')
        setIsUnlocked(true)
    }

    if (reports.length === 0) {
        return (
            <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10 border-dashed">
                <p className="text-white/40 text-lg mb-4">No public reports found matching this query yet.</p>
                <a href="/report" className="btn btn-primary inline-block px-6 py-2 rounded bg-indigo-600">
                    Submit a Report
                </a>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span>📋</span> Recent Community Reports
            </h3>

            {/* Locked State Overlay - Only show if NOT unlocked and has reports */}
            {!isUnlocked && (
                <div className="glass-panel p-6 border-2 border-yellow-500/50 bg-yellow-500/10 mb-8 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-gray-900/90 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-2xl font-bold mb-2">Evidence Hidden</h3>
                            <p className="text-white/60 mb-6">
                                To protect our community and prevent spam, detailed evidence photos and victim stories are locked.
                            </p>
                            <button
                                onClick={handleUnlock}
                                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-105"
                            >
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.68-2.031-.967-.272-.297-.57-.446-.869-.446-.297 0-.643.003-.99.006-.347.016-.917.147-1.388.667-.471.52-1.807 1.765-1.807 4.305 0 2.541 1.857 4.994 2.105 5.341.248.347 3.655 5.584 8.855 7.737.495.205.996.387 1.458.53.771.238 1.637.204 2.324.102.768-.113 1.758-.718 2.006-1.412.248-.694.248-1.289.173-1.413z" /></svg>
                                Share to Unlock
                            </button>
                            <p className="text-xs text-white/40 mt-4">
                                Checking strict safety filters...
                            </p>
                        </div>
                    </div>
                    {/* Dummy blurred content behind */}
                    <div className="filter blur-sm opacity-50 pointer-events-none select-none">
                        <div className="h-32 bg-white/5 rounded mb-4"></div>
                        <div className="h-32 bg-white/5 rounded mb-4"></div>
                    </div>
                </div>
            )}

            {/* Actual Reports List (Blurred if locked) */}
            <div className={`transition-all duration-500 ${!isUnlocked ? 'filter blur-xl opacity-30 h-64 overflow-hidden pointer-events-none' : ''}`}>
                {reports.map(report => (
                    <div key={report.id} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all mb-4">
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

                        <div className="flex gap-2 items-center">
                            {report.evidence_image ? (
                                <div className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                                    <span>📎</span> Evidence Attached
                                </div>
                            ) : (
                                <div className="text-xs px-2 py-1 rounded bg-white/5 text-white/30">
                                    No Evidence
                                </div>
                            )}
                            {report.url && report.url !== 'N/A' && (
                                <div className="text-xs text-white/40 truncate max-w-[200px]">
                                    Link: {report.url}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* SEO Text (Always Visible at bottom) */}
            <div className="mt-8 p-4 rounded bg-white/5 border border-white/10 text-sm text-white/50">
                <h4 className="font-semibold text-white/80 mb-2">Why is this data locked?</h4>
                <p>
                    We protect the privacy of our reporters while ensuring the community is warned.
                    Verified evidence is sensitive. By sharing this report, you help spread awareness
                    and prevent others from falling victim to the <strong>{query}</strong> scam.
                </p>
            </div>
        </div>
    )
}
