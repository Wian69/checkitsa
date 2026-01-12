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
            {loading && <LoadingOverlay message="Verifying Business Registry..." />}

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Business Verification</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '4rem' }}>
                    Verify businesses against South African official registries (CIPC & BizPortal).
                </p>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <form onSubmit={handleCheck} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. 2020/123456/07 OR 'Company Name'"
                            required
                            style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                        />
                        <button disabled={loading} className="btn btn-primary" style={{ minWidth: '120px' }}>
                            {loading ? 'Verifying...' : 'Search'}
                        </button>
                    </form>

                    {result && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{
                                padding: '2rem',
                                border: `1px solid ${(result.status === 'Verified' || result.status.includes('Found')) ? 'var(--color-success)' : 'var(--color-danger)'}`,
                                borderRadius: '0.8rem',
                                marginBottom: '1.5rem',
                                background: 'rgba(255,255,255,0.03)',
                                textAlign: 'center'
                            }}>
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    color: (result.status === 'Verified' || result.status.includes('Found')) ? 'var(--color-success)' : 'var(--color-danger)',
                                    marginBottom: '1rem'
                                }}>
                                    {result.message}
                                </h2>

                                {(result.status === 'Verified' || result.status.includes('Found')) && (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>
                                                {result.name}
                                            </div>
                                            <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                                                Registration Number: <span style={{ color: 'white', fontWeight: 600 }}>{result.identifier}</span>
                                            </div>
                                            {result.industry && result.industry !== 'Unknown' && (
                                                <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                    Industry: <span style={{ color: 'white', fontWeight: 600 }}>{result.industry}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            Source: {result.source}
                                        </div>

                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
                                            <ReportButton url={result.name} type="Business" reason="Fraudulent Business" />
                                        </div>
                                    </div>
                                )}

                                {!result.status.includes('Found') && result.status !== 'Verified' && (
                                    <p style={{ color: 'var(--color-danger)' }}>{result.message}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
