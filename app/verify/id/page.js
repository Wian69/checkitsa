"use client"
import Navbar from '@/components/Navbar'


import { useState } from 'react'
import { trackSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'

export default function IDCheck() {
    const [idNumber, setIdNumber] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleVerify = async (e) => {
        e.preventDefault()

        const { canSearch } = trackSearch()
        if (!canSearch) {
            alert("You've reached your limit of 5 free searches. Please upgrade to Pro for unlimited access.")
            router.push('/subscription')
            return
        }

        setLoading(true)
        setResult(null)
        setError('')

        try {
            const res = await fetch('/api/verify/id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.message)
            setResult(data.data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Identity Check</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '4rem' }}>
                    Verify SA ID numbers and validate citizenship status.
                </p>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                    <form onSubmit={handleVerify} style={{ marginBottom: '2rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>South African ID Number</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    placeholder="e.g. 9001015000080"
                                    maxLength={13}
                                    required
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--color-border)',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '1.25rem',
                                        letterSpacing: '0.1em'
                                    }}
                                />
                                <button disabled={loading} className="btn btn-primary" style={{ minWidth: '120px' }}>
                                    {loading ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '0.5rem' }}>
                            Error: {error}
                        </div>
                    )}

                    {result && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-success)' }}>✅ Identity Verified</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {[
                                    { label: 'Full Name', val: result.fullName },
                                    { label: 'Status', val: result.status },
                                    { label: 'Gender', val: result.gender },
                                    { label: 'Date of Birth', val: result.dob },
                                    { label: 'Citizenship', val: result.citizenship },
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.label}</div>
                                        <div style={{ fontWeight: 600 }}>{item.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                    To report a fraudulent ID, please use the <a href="/report" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Report Incident</a> feature.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
