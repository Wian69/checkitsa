"use client"
import Navbar from '@/components/Navbar'

import ReportButton from '@/components/ReportButton'
import { useState } from 'react'
import { trackSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'

export default function EmailVerify() {
    const [formData, setFormData] = useState({ sender: '', subject: '', content: '' })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

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
        } catch (e) { } finally { setLoading(false) }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
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
                        <div style={{ marginTop: '2rem', padding: '1.5rem', border: `1px solid ${result.score > 50 ? 'var(--color-danger)' : 'var(--color-success)'} `, borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                            <h3 style={{ color: result.score > 50 ? 'var(--color-danger)' : 'var(--color-success)', marginBottom: '1rem' }}>
                                {result.message}
                            </h3>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <p><strong>Risk Score:</strong> {result.score}/100</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-gray-700/50 p-4 rounded-xl">
                                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Domain Age:</span>
                                    <span className="text-white font-mono">{result.domain_age}</span>
                                </div>
                                <div className="bg-gray-700/50 p-4 rounded-xl">
                                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Registrar:</span>
                                    <span className="text-white font-mono">{result.registrar || 'Unknown'}</span>
                                </div>
                                <div className="bg-gray-700/50 p-4 rounded-xl md:col-span-2">
                                    <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">First Seen:</span>
                                    <span className="text-white font-mono">{result.email_first_seen || 'No public footprint'}</span>
                                </div>
                            </div>

                            {result.flags.length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <strong>Risk Factors:</strong>
                                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--color-accent)' }}>
                                        {result.flags.map((f, i) => <li key={i}>{f}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <ReportButton url={formData.sender} type="Email" reason="Phishing/Scam Email" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main >
    )
}
