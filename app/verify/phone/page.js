"use client"
import Navbar from '@/components/Navbar'


import { useState, useEffect } from 'react'
import { trackSearch, addToHistory, incrementSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function PhoneCheck() {
    const [phone, setPhone] = useState('')
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

    const handleCheck = async (e) => {
        e.preventDefault()

        const { canSearch } = trackSearch()
        if (!canSearch) {
            alert("You've reached your limit of 5 free searches. Please upgrade to Pro for unlimited access.")
            router.push('/subscription')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/verify/phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })
            const data = await res.json()
            setResult(data.data)
            await addToHistory('Phone Check', phone, data.data.risk_analysis)
            await incrementSearch()
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />

            {loading && <LoadingOverlay message="Querying Telephony Data..." />}

            <div className="container" style={{ paddingTop: '8rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Phone Number Lookup</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                    Identify carrier, location, and check for spam reports.
                </p>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <form onSubmit={handleCheck} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 082 123 4567"
                            required
                            style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                        />
                        <button disabled={loading} className="btn btn-primary" style={{ minWidth: '120px' }}>
                            {loading ? 'Checking...' : 'Search'}
                        </button>
                    </form>

                    {result && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Network / Carrier</div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{result.carrier}</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Location / Area</div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{result.location}</div>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <strong>RICA Status Estimate:</strong>
                                    <span style={{ color: 'var(--color-success)' }}>{result.rica_status}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{result.rica_note}</p>
                            </div>

                            <div style={{ padding: '1.5rem', background: result.risk_analysis.includes('High') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem' }}>
                                <strong>Risk Analysis:</strong> {result.risk_analysis}
                                {result.flags.length > 0 && <ul style={{ marginTop: '0.5rem' }}>{result.flags.map((f, i) => <li key={i}>{f}</li>)}</ul>}
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                    To report this number, please use the <a href="/report" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Report Incident</a> feature.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
