"use client"
import Navbar from '@/components/Navbar'
import { useState } from 'react'

export default function JobVerifyPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [formData, setFormData] = useState({
        jobUrl: '',
        email: '',
        companyName: '',
        jobDescription: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        try {
            const res = await fetch('/api/verify/job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            setResult(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6 font-outfit">
                    Job Scam Validator
                </h1>
                <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
                    Analyze recruiter emails, job links, and ad text for hidden scam signals like upfront fees.
                </p>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Job Link / Application URL (Optional)</label>
                            <input
                                type="url"
                                placeholder="e.g. bit.ly/easy-job"
                                value={formData.jobUrl}
                                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Recruiter Email (If available)</label>
                            <input
                                type="email"
                                placeholder="e.g. careers@gmail.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Company Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Awesome Reps Ltd"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Job Description / Ad Text</label>
                            <textarea
                                rows={4}
                                placeholder="Paste the job ad content here..."
                                value={formData.jobDescription}
                                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem' }}
                        >
                            {loading ? 'Analyzing...' : 'Scan Job Offer'}
                        </button>
                    </form>

                    {result && (
                        <div className={`mt-8 overflow-hidden rounded-2xl border ${result.isSafe ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-red-500/50 bg-red-950/20'} transition-all duration-500`}>
                            {/* Header Status */}
                            <div className={`p-6 text-center border-b ${result.isSafe ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                                <h3 className={`text-2xl font-bold mb-1 ${result.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {result.verdict}
                                </h3>
                                <p className="text-white/60 text-sm">Targeted Scam Analysis</p>
                            </div>

                            <div className="p-6">
                                {/* Risk Gauge */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm uppercase tracking-wider text-white/60">Risk Score</span>
                                        <span className={`text-3xl font-bold ${result.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>{result.riskScore}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${result.isSafe ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}
                                            style={{ width: `${result.riskScore}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Risk Factors */}
                                {result.reasons.length > 0 ? (
                                    <div className="mt-8 space-y-3">
                                        <h4 className="text-sm uppercase tracking-wider text-white/60 border-b border-white/10 pb-2">Risk Factors ({result.reasons.length})</h4>
                                        {result.reasons.map((f, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                                                <span className="mt-0.5">⚠️</span>
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-emerald-400/80 text-sm text-center">
                                        No specific scam triggers found, but always verify independently.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
