"use client"
import Navbar from '@/components/Navbar'


import { useState, useEffect } from 'react'
import { trackSearch, checkLimit, addToHistory, incrementSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'
import ShareButton from '@/components/ShareButton'

export default function ScamCheck() {
    const [input, setInput] = useState('')
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
        setResult(null)
        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            })
            const data = await res.json()
            setResult(data)
            await addToHistory('Website Scan', input, data.verdict)
            await incrementSearch()
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }



    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />

            {loading && <LoadingOverlay message="Scanning Website..." />}

            <div className="container" style={{ flex: 1, paddingTop: '10rem', paddingBottom: '4rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Website Scanner</h1>
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '3rem' }}>
                        Enter a URL below to check for phishing, malicious redirects, and transparency info.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. example.com"
                            required
                            style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                        />
                        <button disabled={loading} className="btn btn-primary" style={{ minWidth: '120px' }}>
                            {loading ? 'Analyzing...' : 'Execute Scan'}
                        </button>
                    </form>

                    {result && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            {/* Header */}
                            <div style={{
                                padding: '1.5rem', borderRadius: '0.5rem',
                                background: result.riskScore > 50 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                border: `1px solid ${result.riskScore > 50 ? 'var(--color-danger)' : 'var(--color-success)'}`,
                                marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', color: result.riskScore > 50 ? 'var(--color-danger)' : 'var(--color-success)', marginBottom: '0.5rem' }}>
                                        {result.verdict} (Risk: {result.riskScore}/100)
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <a href={result.details.url} target="_blank" style={{ fontWeight: 600, textDecoration: 'underline' }}>
                                            {result.details.domain} {result.details.is_shortened && <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 400 }}>(Alias)</span>}
                                        </a>
                                        {result.details.original_url && (
                                            <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                                                via {new URL(result.details.original_url).hostname}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>📢 Warn Your Community:</div>
                                <ShareButton
                                    query={result.details.domain}
                                    status={result.verdict}
                                />
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'right', marginTop: '0.5rem' }}>
                                To report a scam, please use the <a href="/report" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Report Incident</a> feature.
                            </p>


                            {/* Summary Section */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-primary)' }}>📝 Content Summary</h3>
                                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                                    "{result.details.summary}"
                                </div>
                            </div>

                            {/* Deep Data Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                {/* Ownership */}
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>🏢 Ownership & Age</h4>
                                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Domain Age</span>
                                            <div style={{ fontWeight: 600 }}>{result.details.domain_age}</div>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Registrar</span>
                                            <div style={{ fontWeight: 600 }}>{result.details.registrar}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Policies */}
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>📜 Legal & Trust</h4>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Privacy Policy</span>
                                            <span>{result.details.policies.privacy ? '✅ Found' : '❌ Missing'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Terms of Service</span>
                                            <span>{result.details.policies.terms ? '✅ Found' : '❌ Missing'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main >
    )
}
