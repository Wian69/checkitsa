"use client"
import Navbar from '@/components/Navbar'

import ReportButton from '@/components/ReportButton'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useState } from 'react'
import { trackSearch, addToHistory, incrementSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'

export default function BusinessCheck() {
    const [input, setInput] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCheck = async (e) => {
        e.preventDefault()

        const { tier, canSearch } = trackSearch()

        // 1. Subscription Tier Check
        if (tier === 'free') {
            alert("Business Verification is only available for Pro, Elite, and Enterprise members. Please upgrade to access this feature.")
            router.push('/subscription')
            return
        }

        // 2. Search Limit Check
        if (!canSearch) {
            alert("You've reached your limit. Please upgrade for more searches.")
            router.push('/subscription')
            return
        }

        setLoading(true)
        setResult(null)
        try {
            const userStr = localStorage.getItem('checkitsa_user')
            const user = userStr ? JSON.parse(userStr) : null
            const email = user ? user.email : null

            const res = await fetch('/api/verify/business', {
                method: 'POST',
                body: JSON.stringify({ input, email })
            })
            const data = await res.json()
            setResult(data.data)

            // Add to History & Consume Search Credit
            if (data.valid) {
                await addToHistory('Business Verify', input, data.data.status)
                await incrementSearch()
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            {loading && <LoadingOverlay message="Deep Searching Registry Index..." />}

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '900px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Business Verification</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '4rem' }}>
                    Verify businesses against South African registries with deep intelligence.
                </p>

                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <form onSubmit={handleCheck} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Search by Company Name or Reg Number..."
                            required
                            style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                        />
                        <button disabled={loading} className="btn btn-primary" style={{ minWidth: '140px' }}>
                            {loading ? 'Analyzing...' : 'Deep Search'}
                        </button>
                    </form>

                    {result && (
                        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                            <div style={{
                                padding: '2rem',
                                border: `1px solid ${(result.status === 'Verified' || result.status.includes('Found')) ? 'var(--color-success)' : 'var(--color-danger)'}`,
                                borderRadius: '1rem',
                                marginBottom: '1.5rem',
                                background: 'rgba(255,255,255,0.02)',
                            }}>
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <h2 style={{
                                        fontSize: '2rem',
                                        color: (result.status === 'Verified' || result.status.includes('Found')) ? 'var(--color-success)' : 'var(--color-danger)',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {result.status || 'Found'}
                                    </h2>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>{result.summary}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {/* Primary Info */}
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid var(--color-border)' }}>
                                        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '1px' }}>Company Identity</h3>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>
                                            {result.name}
                                        </div>
                                        <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            Reg No: <span style={{ color: 'white', fontWeight: 600 }}>{result.identifier}</span>
                                        </div>
                                        <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                                            Industry: <span style={{ color: 'white', fontWeight: 600 }}>{result.industry}</span>
                                        </div>
                                        <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                            Registration Date: <span style={{ color: 'white', fontWeight: 600 }}>{result.registrationDate || 'Unknown'}</span>
                                        </div>
                                    </div>

                                    {/* Logistics & People */}
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid var(--color-border)' }}>
                                        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '1px' }}>Logistics & Leadership</h3>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Registered Address</div>
                                            <div style={{ color: 'white', lineHeight: '1.4' }}>{result.address || 'Not visible in search index'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Directors / Officers</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {result.directors && result.directors.length > 0 ? (
                                                    result.directors.map((d, i) => (
                                                        <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.9rem', color: 'white' }}>
                                                            {d}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Information not public in results</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ mt: '2rem', pt: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                        <strong>Attestation:</strong> This data is aggregated from high-authority South African indices including CIPC, BizPortal, and official company filings.
                                        <br />
                                        <span style={{ opacity: 0.7 }}>Indices used: {result.source}</span>
                                    </div>
                                    <ReportButton url={result.name} type="Business" reason="Fraudulent Business" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>💡 Note on Search Limits</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
                        Your daily limit is based on the **number of searches**, not the amount of detail. Deep extraction for addresses and directors is included in every search for Pro & Elite members at no extra credit cost.
                    </p>
                </div>
            </div>
        </main>
    )
}
