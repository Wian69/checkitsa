"use client"
import Navbar from '@/components/Navbar'

import ReportButton from '@/components/ReportButton'
import { useState } from 'react'
import { trackSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'

export default function BusinessCheck() {
    const [input, setInput] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCheck = async (e) => {
        e.preventDefault()

        const { canSearch } = trackSearch()
        if (!canSearch) {
            alert("You've reached your limit of 5 free searches. Please upgrade to Pro for unlimited access.")
            router.push('/subscription')
            return
        }

        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/verify/business', {
                method: 'POST',
                body: JSON.stringify({ input })
            })
            const data = await res.json()
            setResult(data.data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Business Verification</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '4rem' }}>
                    Cross-reference CIPC and external data for legitimacy.
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
                            {loading ? 'Search' : 'Search'}
                        </button>
                    </form>

                    {result && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ padding: '1.5rem', border: `1px solid ${result.status.includes('Found') ? 'var(--color-success)' : 'var(--color-danger)'}`, borderRadius: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                                <h2 style={{ fontSize: '1.5rem', color: result.status.includes('Found') ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: '0.5rem' }}>
                                    {result.status}
                                </h2>
                                <p style={{ marginBottom: '1rem' }}>{result.message}</p>

                                {result.status.includes('Found') && (
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Found Entity</span>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{result.name}</div>
                                            {result.identifier && result.identifier !== 'Unknown' && (
                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                    Registration: {result.identifier}
                                                </div>
                                            )}
                                        </div>
                                        {result.details && <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem', whiteSpace: 'pre-line' }}>{result.details}</div>}
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                            <ReportButton url={result.name} type="Business" reason="Fraudulent Business" />
                                        </div>
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
