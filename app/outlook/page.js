"use client"
import { useState, useEffect } from 'react'
import Script from 'next/script'

export const runtime = 'edge'

export default function OutlookTaskpane() {
    const [status, setStatus] = useState('Initializing...')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Office.onReady to ensure Office.js is loaded
        if (typeof window !== 'undefined' && window.Office) {
            window.Office.onReady((info) => {
                if (info.host === window.Office.HostType.Outlook) {
                    setStatus('Ready to scan')
                    autoScan()
                } else {
                    setStatus('Not in Outlook')
                }
            })
        }
    }, [])

    const autoScan = async () => {
        if (!window.Office || !window.Office.context.mailbox.item) return

        setLoading(true)
        setError(null)
        try {
            const item = window.Office.context.mailbox.item

            // Get sender, subject, and body snippets
            const sender = item.from.emailAddress
            const subject = item.subject

            // We need to use callback for body
            item.body.getAsync("text", async (asyncResult) => {
                if (asyncResult.status === window.Office.AsyncResultStatus.Succeeded) {
                    const content = asyncResult.value

                    // Call our existing API
                    const res = await fetch('/api/verify/email', {
                        method: 'POST',
                        body: JSON.stringify({ sender, subject, content })
                    })
                    const data = await res.json()
                    setResult(data)
                    setLoading(false)
                } else {
                    setError("Failed to read email content.")
                    setLoading(false)
                }
            })
        } catch (e) {
            setError(e.message)
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#030712] text-white p-4 font-outfit overflow-x-hidden">
            <Script
                src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
                strategy="beforeInteractive"
                onLoad={() => {
                    if (window.Office) {
                        window.Office.onReady(() => setStatus('Office Ready'))
                    }
                }}
            />

            <div className="mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-xs">CI</div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    CheckItSA
                </h1>
            </div>

            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Scanning for scams...</p>
                </div>
            )}

            {!loading && !result && !error && (
                <div className="text-center py-8 opacity-60 italic text-sm">
                    {status === 'Ready to scan' ? 'Select an email to begin analysis.' : status}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-4 rounded-2xl border ${result.score > 50 ? 'border-red-500/50 bg-red-950/20' : 'border-emerald-500/50 bg-emerald-950/20'}`}>
                        <div className="text-center mb-4">
                            <h3 className={`text-lg font-bold ${result.score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {result.score > 60 ? '⛔ DANGEROUS' : (result.score > 30 ? '⚠️ SUSPICIOUS' : '✅ SAFE')}
                            </h3>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Verification Engine v2.1</div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] uppercase text-white/60 font-bold">Risk Level</span>
                                <span className={`text-xl font-bold ${result.score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{result.score}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${result.score > 50 ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                                    style={{ width: `${result.score}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <div className="text-[10px] text-white/40 uppercase mb-1">Domain Age</div>
                                <div className="text-sm font-medium">{result.domain_age}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <div className="text-[10px] text-white/40 uppercase mb-1">Footprint</div>
                                <div className="text-sm font-medium leading-tight">{result.email_first_seen}</div>
                            </div>
                        </div>
                    </div>

                    {result.flags.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] uppercase text-white/40 font-bold px-1">Risk Factors</h4>
                            {result.flags.map((f, i) => (
                                <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-200/80 text-[11px] leading-relaxed flex gap-2">
                                    <span className="shrink-0">⚠️</span>
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={autoScan}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all mt-4"
                    >
                        Re-Scan Email
                    </button>

                    <p className="text-[10px] text-center text-white/30 italic mt-6">
                        Scams are evolving daily. If something feels off, trust your gut.
                    </p>
                </div>
            )}
        </main>
    )
}
