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
    const [expanded, setExpanded] = useState(false);

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

            {loading && <LoadingOverlay message="Compiling Contact Intelligence..." />}

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

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>{result.name}</h2>
                                    {result.summary && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <p style={{
                                                color: 'rgba(255,255,255,0.6)',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.6',
                                                display: '-webkit-box',
                                                WebkitLineClamp: expanded ? 'unset' : '2',
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {result.summary}
                                            </p>
                                            {result.summary.length > 120 && (
                                                <button
                                                    onClick={() => setExpanded(!expanded)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#818cf8',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600',
                                                        padding: '0',
                                                        marginTop: '0.5rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {expanded ? 'Read Less' : 'Read More'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {result.website && result.website !== "Not Listed" && (
                                    <a
                                        href={result.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '0.7rem 1.4rem',
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            border: '1px solid rgba(99, 102, 241, 0.4)',
                                            color: '#818cf8',
                                            borderRadius: '0.5rem',
                                            fontWeight: '600',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; e.currentTarget.style.borderColor = '#818cf8'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; }}
                                    >
                                        Visit Website ↗
                                    </a>
                                )}
                            </div>

                            {result.tags && result.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2rem' }}>
                                    {result.tags.map((tag, i) => (
                                        <span key={i} style={{
                                            fontSize: '0.75rem',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            color: '#34d399',
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '999px',
                                            fontWeight: '600',
                                            border: '1px solid rgba(52, 211, 153, 0.25)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.02em'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                    {/* Legal Section */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#818cf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>⚖️</span> Legal & Financial
                                        </h3>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Registration Number</label>
                                                <div style={{ fontSize: '1.1rem', fontFamily: 'monospace', color: 'white' }}>{result.identifier}</div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>VAT Number</label>
                                                <div style={{ fontSize: '1.1rem', fontFamily: 'monospace', color: result.vatNumber !== "Not Listed" ? 'white' : 'rgba(255,255,255,0.3)' }}>{result.vatNumber}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leadership Section */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#818cf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>👥</span> Key Leadership
                                        </h3>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Directors / CEO</label>
                                            {result.directors && result.directors.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {result.directors.map((d, i) => (
                                                        <span key={i} style={{
                                                            fontSize: '0.9rem',
                                                            color: 'white',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            padding: '0.3rem 0.6rem',
                                                            borderRadius: '0.4rem',
                                                            border: '1px solid rgba(255,255,255,0.1)'
                                                        }}>
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontStyle: 'italic' }}>Not publically listed</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Contact Number</label>
                                        <div style={{ fontSize: '1.2rem', color: 'white' }}>{result.phone}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Physical Address</label>
                                        <div style={{ fontSize: '1.1rem', color: 'white' }}>{result.address}</div>
                                    </div>
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
