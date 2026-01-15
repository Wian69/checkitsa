"use client"
import Navbar from '@/components/Navbar'


import { useState, useEffect } from 'react'
import { trackSearch, addToHistory, incrementSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function EmailVerify() {
    const [formData, setFormData] = useState({ sender: '', subject: '', content: '' })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const user = localStorage.getItem('checkitsa_user')
        if (!user) {
            alert('Please create a free account or login to access our verification tools.')
            router.push('/signup')
        }
    }, [])

    const handleScan = async (e) => {
        e.preventDefault()

        const { canSearch } = trackSearch()
        if (!canSearch) {
            alert("You've reached your limit of 5 free searches. Please upgrade to Pro for unlimited access.")
            router.push('/subscription')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/verify/email', {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            setResult(data)
            await addToHistory('Email Analysis', formData.sender, data.message)
            await incrementSearch()
        } catch (e) { } finally { setLoading(false) }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            {loading && <LoadingOverlay message="Analyzing Email Reputation..." />}

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6 font-outfit">
                    Email Scanning
                </h1>
                <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
                    Analyze headers, domain age, and sender reputation to detect phishing attempts.
                </p>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <form onSubmit={handleScan} style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Sender Address</label>
                            <input
                                type="email"
                                placeholder="e.g. contact@example.com"
                                value={formData.sender}
                                onChange={e => setFormData({ ...formData, sender: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Subject</label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Body</label>
                            <textarea
                                rows={4}
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>
                        <button disabled={loading} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            {loading ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                    </form>

                    {result && (
                        <div className={`mt-8 overflow-hidden rounded-2xl border ${result.score > 50 ? 'border-red-500/50 bg-red-950/20' : 'border-emerald-500/50 bg-emerald-950/20'} transition-all duration-500`}>
                            {/* Header Status */}
                            <div className={`p-6 text-center border-b ${result.score > 50 ? 'border-red-500/30 bg-red-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                                <h3 className={`text-2xl font-bold mb-1 ${result.score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {result.score > 60 ? '⛔ DANGEROUS' : (result.score > 30 ? '⚠️ SUSPICIOUS' : '✅ SAFE TO REPLY')}
                                </h3>
                                <p className="text-white/60 text-sm">Automated Security Analysis</p>
                            </div>

                            <div className="p-6">
                                {/* Risk Gauge */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm uppercase tracking-wider text-white/60">Threat Level</span>
                                        <span className={`text-3xl font-bold ${result.score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{result.score}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${result.score > 50 ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                                            style={{ width: `${result.score}%` }}
                                        ></div>
                                    </div>
                                    <p className="mt-2 text-xs text-center text-white/40">
                                        {result.score > 50 ? 'Do not click links or reply.' : 'Sender appears legitimate based on digital footprint.'}
                                    </p>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span>📅</span>
                                            <span className="text-xs uppercase tracking-wider text-white/60">Domain Age</span>
                                        </div>
                                        <span className="text-lg font-mono font-medium">{result.domain_age}</span>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span>🏢</span>
                                            <span className="text-xs uppercase tracking-wider text-white/60">Registrar</span>
                                        </div>
                                        <span className="text-lg font-mono font-medium truncate" title={result.registrar}>{result.registrar || 'Unknown'}</span>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 col-span-1 md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span>👣</span>
                                            <span className="text-xs uppercase tracking-wider text-white/60">Digital Footprint</span>
                                        </div>
                                        <div className={`text-lg font-medium ${result.email_first_seen?.includes('Private') || result.email_first_seen?.includes('Verified') ? 'text-emerald-300' : 'text-white'}`}>
                                            {result.email_first_seen || 'No public footprint'}
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Factors */}
                                {result.flags.length > 0 && (
                                    <div className="mt-8 space-y-3">
                                        <h4 className="text-sm uppercase tracking-wider text-white/60 border-b border-white/10 pb-2">Risk Factors ({result.flags.length})</h4>
                                        {result.flags.map((f, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                                                <span className="mt-0.5">⚠️</span>
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-black/20 p-4 text-center border-t border-white/5">
                                <Link href="/report" className="text-sm text-white/60 hover:text-white hover:underline transition-colors flex items-center justify-center gap-2">
                                    <span>Was this actual fraud? Report it here</span>
                                    <span>→</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main >
    )
}
