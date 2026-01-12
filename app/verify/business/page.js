"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

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

        if (!user) {
            setError('Please sign in to access business intelligence.')
            return
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/verify/business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input, email: user.email }),
            });

            const data = await res.json();
            if (data.valid) {
                setResult(data.data);
            } else {
                setError(data.data?.message || 'Verification failed.');
            }
        } catch (err) {
            setError('An error occurred during search.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '8rem 2rem 4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Business Intelligence
                    </h1>
                    <p style={{ color: 'var(--color-text-dim)', fontSize: '1.2rem' }}>
                        Access high-depth company data, leadership profiles, and global market status.
                    </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)', marginBottom: '3rem' }}>
                    <form onSubmit={handleVerify} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Search by Company Name or Registration Number..."
                            required
                            style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ padding: '1rem 2rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Synthesizing...' : 'Search Intelligence'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1.5rem', borderRadius: '1rem', color: '#fca5a5', marginBottom: '2rem' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {result && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            {/* Company Identity */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '2.5rem' }}>{result.icon}</span>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{result.name}</h2>
                                        <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Reg No: {result.identifier}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.2rem' }}>Industry</label>
                                        <p style={{ fontWeight: '500' }}>{result.industry}</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.2rem' }}>Registration Date</label>
                                        <p style={{ fontWeight: '500' }}>{result.registrationDate}</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.2rem' }}>Employees</label>
                                        <p style={{ fontWeight: '500' }}>{result.employees}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Operations & Global Role */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Logistics & Global Scale</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Registered Headquarters</label>
                                        <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{result.address}</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Global Footprint</label>
                                        <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{result.globalRole}</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Core Operations</label>
                                        <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{result.operations}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Leadership & Status */}
                            <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--color-primary)' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem', color: '#818cf8' }}>Executive Leadership</h3>
                                <div style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {result.directors && result.directors.length > 0 ? (
                                        result.directors.map((name, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '0.5rem' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                                                <span style={{ fontWeight: '500' }}>{name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ color: 'var(--color-text-dim)' }}>Leadership details being processed...</p>
                                    )}
                                </div>
                                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.2rem' }}>Current Status</label>
                                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '2rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.85rem', fontWeight: '700' }}>
                                        {result.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Executive Intelligence Summary</h3>
                            <p style={{ color: 'var(--color-text-dim)', lineHeight: '1.6', fontSize: '1rem' }}>{result.summary}</p>
                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                <p><strong>Intelligence Source:</strong> {result.source}</p>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            </div>
        </main>
    );
}
