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
        <main className="min-h-screen pb-24">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-32 px-8">
                <h1 className="text-4xl font-black text-white mb-8 text-center">Business Search</h1>

                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 mb-12">
                    <form onSubmit={handleVerify} className="flex gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter Company Name..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                            required
                        />
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-lg transition-colors">
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg mb-8">{error}</div>}

                {result && (
                    <div className="grid gap-6">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-6">{result.name}</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">Registration Number</label>
                                    <div className="text-xl font-mono text-emerald-400">{result.identifier}</div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">Physical Address</label>
                                    <div className="text-lg text-white">{result.address}</div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">Contact Number</label>
                                    <div className="text-lg text-white">{result.phone}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {loading && <LoadingOverlay message="Locating Registration Details..." />}
        </main>
    );
}
