"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function BusinessVerificationPage() {
    const [user, setUser] = useState(null)
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (u) setUser(JSON.parse(u))
    }, [])

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await fetch('/api/verify/business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input, email: user?.email || 'guest' }),
            });
            const data = await res.json();
            if (data.valid) setResult(data.data);
            else setError(data.data?.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            {loading && <LoadingOverlay message="Locating Registration Details..." />}

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center', fontWeight: '800' }}>Business Search</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '4rem', fontSize: '1.2rem' }}>
                    Verify legally registered South African companies (CIPC).
                </p>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
                    <form onSubmit={handleVerify} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter Company Name..."
                            required
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--color-border)',
                                color: 'white',
                                fontSize: '1.1rem'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '0.5rem',
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1,
                                minWidth: '120px'
                            }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid #ef4444' }}>
                        Error: {error}
                    </div>
                )}

                {result && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>{result.name}</h2>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Registration Number</label>
                                    <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: '#34d399' }}>{result.identifier}</div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Physical Address</label>
                                    <div style={{ fontSize: '1.2rem', color: 'white' }}>{result.address}</div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Contact Number</label>
                                    <div style={{ fontSize: '1.2rem', color: 'white' }}>{result.phone}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
}
