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
                if (data.data?.details) {
                    setResult({ details: data.data.details }); // Temporarily store details in result for the error view
                }
            }
        } catch (err) {
            setError('An error occurred during search.');
            setResult({ details: err.message });
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
                            {loading ? 'Compiling...' : 'Search Intelligence'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1.5rem', borderRadius: '1rem', color: '#fca5a5', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ Synthesis Error</h3>
                        <p style={{ marginBottom: '1rem' }}>{error}</p>
                        {result?.details && (
                            <details style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', opacity: 0.8 }}>View Debug Trace</summary>
                                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', fontFamily: 'monospace', color: '#e5e7eb' }}>
                                    {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                )}

                {result && result.identifier && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                            {/* Profile Header */}
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 col-span-full">
                                <div className="flex items-center gap-4">
                                    <span style={{ fontSize: '2rem' }}>{result.icon || '🏢'}</span>
                                    <div>
                                        <h2 className="text-xl font-black text-white">{result.name}</h2>
                                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-1">{result.industry}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-white/40 text-[10px] uppercase font-bold">Business Age</p>
                                        <p className="text-indigo-400 font-bold text-lg">{result.businessAge || 'Verified'}</p>
                                    </div>
                                    <div className="ml-4 text-right border-l border-white/10 pl-4">
                                        <p className="text-white/40 text-[10px] uppercase">Intelligence Confidence</p>
                                        <p className="text-emerald-400 font-bold">HIGH</p>
                                    </div>
                                </div>
                            </div>

                            {/* Legal & Financial */}
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <h3 className="text-indigo-400 text-sm font-bold mb-4 flex items-center gap-2">
                                    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Legal & Financial
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Registration Number</p>
                                        <p className="text-white font-mono text-lg">{result.identifier}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">VAT Number</p>
                                        <p className="text-white font-mono">{result.vatNumber || 'Not Found'}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase font-bold">Status</p>
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-black uppercase">{result.status}</span>
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase font-bold">Est.</p>
                                            <p className="text-white text-xs font-bold">{result.registrationDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logistics & Contact */}
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <h3 className="text-indigo-400 text-sm font-bold mb-4 flex items-center gap-2">
                                    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Logistics & HQ
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Headquarters Address</p>
                                        <p className="text-white text-sm leading-snug">{result.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Primary Contact</p>
                                        <p className="text-white font-bold">{result.phone}</p>
                                    </div>
                                    {result.branches && result.branches.length > 0 && (
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase font-bold">Other Locations</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {result.branches.map((b, i) => (
                                                    <span key={i} className="text-[9px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white/60">{b}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Leadership */}
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <h3 className="text-indigo-400 text-sm font-bold mb-4 flex items-center gap-2">
                                    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    Key Leadership
                                </h3>
                                <div className="space-y-2">
                                    {result.directors && result.directors.length > 0 ? (
                                        result.directors.map((d, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-indigo-500/5 px-3 py-2 rounded-lg border border-indigo-500/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                <span className="text-xs text-indigo-100 font-medium">{d}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-white/20 text-xs italic">Director mapping not found in current context</p>
                                    )}
                                </div>
                            </div>

                            {/* Scale & Ops */}
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 col-span-full">
                                <h3 className="text-indigo-400 text-sm font-bold mb-3">Core Operations & Market Position</h3>
                                <p className="text-white/70 text-sm leading-relaxed mb-4">{result.operations}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Global Footprint</p>
                                        <p className="text-white text-xs font-bold">{result.globalRole}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Employee Scale</p>
                                        <p className="text-white text-xs font-bold">{result.employees}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Data Source</p>
                                        <p className="text-indigo-400 text-[10px] font-bold">{result.source}</p>
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

            {loading && <LoadingOverlay message="Compiling Deep Business Profile..." />}
        </main>
    );
}
