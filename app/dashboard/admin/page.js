"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
    const [secret, setSecret] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [users, setUsers] = useState([])
    const [emailSearch, setEmailSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (u) {
            const userData = JSON.parse(u)
            if (userData.email === 'wiandurandt69@gmail.com') {
                setIsAuthorized(true)
            }
        }
    }, [])

    const [verifying, setVerifying] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setVerifying(true)
        setStatusMsg({ type: '', text: '' })
        try {
            // Fetch ALL users to test secret
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify({ email: '', adminEmail: 'wiandurandt69@gmail.com', secret })
            })
            const data = await res.json()
            if (data.success) {
                setUsers(data.users || [])
                setIsLoggedIn(true)
            } else {
                setStatusMsg({ type: 'error', text: data.message || 'Invalid Secret Key' })
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: 'Connection failed' })
        } finally {
            setVerifying(false)
        }
    }

    const handleUpdateTier = async (email, newTier) => {
        if (!confirm(`Change ${email} to ${newTier}?`)) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/set-tier', {
                method: 'POST',
                body: JSON.stringify({ email: email, tier: newTier, adminEmail: 'wiandurandt69@gmail.com', secret })
            })
            const data = await res.json()
            if (data.success) {
                setStatusMsg({ type: 'success', text: `Successfully updated ${email} to ${newTier}` })
                setUsers(users.map(u => u.email === email ? { ...u, tier: newTier } : u))
            } else {
                setStatusMsg({ type: 'error', text: data.message || 'Update failed' })
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: 'Update failed' })
        } finally {
            setLoading(false)
        }
    }



    if (!isAuthorized) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
                <div className="glass-panel" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🚫</div>
                    <h1 style={{ marginBottom: '1rem' }}>Access Denied</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        This area is restricted to site owners only.
                    </p>
                    <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>Return Home</Link>
                </div>
            </main>
        )
    }

    if (!isLoggedIn) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
                <div className="glass-panel" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '2rem' }}>Admin Access</h1>
                    <form onSubmit={handleLogin}>
                        {statusMsg.text && !isLoggedIn && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
                                {statusMsg.text}
                            </div>
                        )}
                        <input
                            type="password"
                            placeholder="Enter Admin Secret"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            required
                            style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white', marginBottom: '1.5rem' }}
                        />
                        <button disabled={verifying} className="btn btn-primary" style={{ width: '100%' }}>
                            {verifying ? 'Verifying...' : 'Enter Dashboard'}
                        </button>
                    </form>
                </div>
            </main>
        )
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '8rem', maxWidth: '1000px' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Site Administrator</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage users, tiers, and platform health.</p>
                </div>

                <div className="grid-responsive" style={{ gap: '2rem' }}>

                    {/* User Management Section */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>👤</span> User Management
                        </h3>

                        <input
                            type="text"
                            placeholder="Filter by email or name..."
                            value={emailSearch}
                            onChange={(e) => setEmailSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', color: 'white', marginBottom: '1.5rem' }}
                        />

                        {statusMsg.text && (
                            <div style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: statusMsg.type === 'error' ? '#fca5a5' : '#6ee7b7', border: `1px solid ${statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}` }}>
                                {statusMsg.text}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {users.filter(u => u.email.includes(emailSearch) || (u.full_name && u.full_name.toLowerCase().includes(emailSearch.toLowerCase()))).map(u => (
                                <UserRow key={u.email} user={u} onUpdateTier={handleUpdateTier} loading={loading} />
                            ))}
                            {users.length === 0 && <div style={{ color: 'var(--color-text-muted)' }}>No users found.</div>}
                        </div>
                    </div>

                    {/* Reports Moderation Section */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🚨</span> Pending Reports Moderation
                        </h3>
                        
                        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            <ReportList adminEmail={foundUser?.email || 'wiandurandt69@gmail.com'} />
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}

function UserRow({ user, onUpdateTier, loading }) {
    const [expanded, setExpanded] = useState(false)
    const [history, setHistory] = useState(null)
    const [loadingHistory, setLoadingHistory] = useState(false)

    const toggleHistory = async () => {
        setExpanded(!expanded)
        if (!expanded && history === null) {
            setLoadingHistory(true)
            try {
                // Fetch reports submitted by this user
                const res = await fetch(`/api/report?email=${encodeURIComponent(user.email)}`)
                const data = await res.json()
                setHistory(data.reports || [])
            } catch (e) {
                console.error("Failed to load history")
                setHistory([])
            } finally {
                setLoadingHistory(false)
            }
        }
    }

    const isPremium = user.tier === 'pro' || user.tier === 'elite' || user.tier === 'custom'

    return (
        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8rem', border: '1px solid var(--color-border)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{user.full_name || 'No Name'}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.8rem',
                            background: isPremium ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            {user.tier || 'free'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            Usage: {user.usage || 0}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                {isPremium ? (
                    <button onClick={() => onUpdateTier(user.email, 'free')} disabled={loading} className="btn" style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.8rem' }}>
                        Revoke Premium
                    </button>
                ) : (
                    <button onClick={() => onUpdateTier(user.email, 'pro')} disabled={loading} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        Upgrade to Pro
                    </button>
                )}
                
                <button onClick={toggleHistory} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', marginLeft: 'auto' }}>
                    {expanded ? 'Hide History' : 'View History'}
                </button>
            </div>

            {expanded && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#e2e8f0', fontSize: '0.9rem' }}>Scam Reporting History</h4>
                    {loadingHistory ? (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Loading reports...</div>
                    ) : history && history.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {history.map(r => (
                                <div key={r.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.4rem', borderLeft: `3px solid ${r.status === 'verified' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <strong style={{ fontSize: '0.9rem' }}>{r.type} - {r.url}</strong>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: r.status === 'verified' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>{r.status}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{r.details || r.reason}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>User has not reported any scams yet.</div>
                    )}
                </div>
            )}
        </div>
    )
}

function ReportList({ adminEmail }) {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/admin/reports?email=${adminEmail}`)
            .then(res => res.json())
            .then(data => {
                if (data.reports) setReports(data.reports)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [adminEmail])

    const handleAction = async (id, action) => {
        try {
            const res = await fetch('/api/admin/reports', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, email: adminEmail })
            })
            if (res.ok) {
                setReports(reports.map(r => r.id === id ? { ...r, status: action === 'verify' ? 'verified' : 'rejected' } : r))
            }
        } catch (e) {
            alert('Action failed')
        }
    }

    if (loading) return <div>Loading reports...</div>
    if (reports.length === 0) return <div style={{ color: 'var(--color-text-muted)' }}>No reports found.</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map(r => (
                <div key={r.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', borderLeft: r.status === 'pending' ? '4px solid #f59e0b' : r.status === 'verified' ? '4px solid #10b981' : '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>{r.scam_type} - {r.scammer_details}</strong>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: r.status === 'pending' ? '#f59e0b' : r.status === 'verified' ? '#10b981' : '#ef4444' }}>{r.status}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#d1d5db', marginBottom: '1rem' }}>{r.description}</p>
                    {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleAction(r.id, 'verify')} className="btn" style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', fontSize: '0.8rem', borderRadius: '0.25rem' }}>Approve</button>
                            <button onClick={() => handleAction(r.id, 'reject')} className="btn" style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', fontSize: '0.8rem', borderRadius: '0.25rem' }}>Reject</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
