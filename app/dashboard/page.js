"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { trackSearch, getHistory } from '@/utils/searchLimit'
import Link from 'next/link'

export default function Dashboard() {
    const [stats, setStats] = useState({ count: 0, limit: 5, tier: 'free', resetType: 'lifetime' })
    const [history, setHistory] = useState({ searches: [], reports: [] })
    const [user, setUser] = useState(null)

    useEffect(() => {
        setStats(trackSearch())
        setHistory(getHistory())
        const u = localStorage.getItem('checkitsa_user')
        if (u) setUser(JSON.parse(u))
    }, [])

    const searchPercentage = Math.min((stats.count / stats.limit) * 100, 100)
    const isCrisis = searchPercentage >= 80

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                            {user ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'My Dashboard'}
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Manage your security profile and history.</p>
                    </div>
                    {stats.tier === 'free' && (
                        <Link href="/subscription" className="btn btn-primary">
                            Upgrade Plan ⚡
                        </Link>
                    )}
                </div>

                <div className="grid-responsive" style={{ gap: '2rem' }}>

                    {/* Usage Card */}
                    <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 1' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📊</span> Usage & Quota
                        </h3>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                border: `8px solid ${isCrisis ? 'var(--color-danger)' : 'var(--color-primary)'}`,
                                borderRightColor: 'rgba(255,255,255,0.1)', // Simplistic CSS loader look
                                margin: '0 auto 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.count}</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/ {stats.limit}</span>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', color: stats.tier === 'free' ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                                {stats.tier} Plan
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                {stats.resetType === 'monthly' ? 'Resets Monthly' : 'Lifetime Limit (No Reset)'}
                            </div>
                        </div>

                        {stats.tier === 'free' && stats.count >= stats.limit && (
                            <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.9rem', textAlign: 'center' }}>
                                Limit Reached. Upgrade to continue searching.
                            </div>
                        )}
                    </div>

                    {/* Security Intel / Notifications */}
                    <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 1' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🛡️</span> Security Intel
                        </h3>

                        {stats.tier === 'free' ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', opacity: 0.7 }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
                                <p style={{ marginBottom: '1.5rem' }}>Global Security Intel is locked.</p>
                                <Link href="/subscription" className="btn btn-outline" style={{ fontSize: '0.9rem' }}>Unlock Intel</Link>
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.25rem' }}>High Alert • Today</div>
                                    <div>Spike in "Post Office" SMS scams detected.</div>
                                </li>
                                <li style={{ padding: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#fbbf24', marginBottom: '0.25rem' }}>Warning • Yesterday</div>
                                    <div>New "Tax Refund" phishing campaign active.</div>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>

                {/* Search History */}
                <div style={{ marginTop: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Search History</h2>
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        {history.searches.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No recent searches found.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Type</th>
                                        <th style={{ padding: '1rem' }}>Query</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.searches.map(s => (
                                        <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>{s.type}</td>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{s.query}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.8rem',
                                                    background: s.status === 'Dangerous' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                    color: s.status === 'Dangerous' ? '#fca5a5' : '#6ee7b7'
                                                }}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                {new Date(s.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Report History */}
                <div style={{ marginTop: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Reports</h2>
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        {history.reports.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                You haven't submitted any reports yet.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Type</th>
                                        <th style={{ padding: '1rem' }}>Details</th>
                                        <th style={{ padding: '1rem' }}>Evidence</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.reports.map(r => (
                                        <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>{r.type}</td>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{r.details}</td>
                                            <td style={{ padding: '1rem' }}>{r.evidence ? '📎 Attached' : '-'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(251, 191, 36, 0.1)',
                                                    color: '#fcd34d'
                                                }}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                {new Date(r.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Account Management */}
                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <h3 style={{ fontSize: '1.2rem', color: '#f87171', marginBottom: '1rem' }}>Account Management</h3>
                        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Reset Local Data</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Clears all history, usage counts, and local session data.</div>
                            </div>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure? This will wipe your local history and logout.')) {
                                        localStorage.clear()
                                        window.location.href = '/signup'
                                    }
                                }}
                                className="btn"
                                style={{
                                    background: 'rgba(220, 38, 38, 0.1)',
                                    color: '#f87171',
                                    border: '1px solid #f87171',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Reset & Logout
                            </button>
                        </div>
                    </div>

                </div>
        </main>
    )
}
