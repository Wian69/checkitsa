"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
    const [secret, setSecret] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(true)
    const [emailSearch, setEmailSearch] = useState('')
    const [foundUser, setFoundUser] = useState(null)
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
            // Test secret by searching for self
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify({ email: 'wiandurandt69@gmail.com', adminEmail: 'wiandurandt69@gmail.com', secret })
            })
            const data = await res.json()
            if (data.success) {
                setIsLoggedIn(true)
            } else {
                setStatusMsg({ type: 'error', text: 'Invalid Secret Key' })
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: 'Connection failed' })
        } finally {
            setVerifying(false)
        }
    }

    const handleSearch = async (e) => {
        e.preventDefault()
        setLoading(true)
        setStatusMsg({ type: '', text: '' })
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify({ email: emailSearch, adminEmail: 'wiandurandt69@gmail.com', secret })
            })
            const data = await res.json()
            if (data.success) {
                setFoundUser(data.user)
            } else {
                setStatusMsg({ type: 'error', text: data.message || 'User not found' })
                setFoundUser(null)
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: 'Search failed' })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateTier = async (newTier) => {
        if (!confirm(`Change ${foundUser.email} to ${newTier}?`)) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/set-tier', {
                method: 'POST',
                body: JSON.stringify({ email: foundUser.email, tier: newTier, adminEmail: 'wiandurandt69@gmail.com', secret })
            })
            const data = await res.json()
            if (data.success) {
                setStatusMsg({ type: 'success', text: `Successfully updated to ${newTier}` })
                setFoundUser({ ...foundUser, tier: newTier })
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

                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <input
                                type="email"
                                placeholder="Search user by email..."
                                value={emailSearch}
                                onChange={(e) => setEmailSearch(e.target.value)}
                                required
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                            <button disabled={loading} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {loading ? '...' : 'Search'}
                            </button>
                        </form>

                        {statusMsg.text && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                marginBottom: '1.5rem',
                                background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                color: statusMsg.type === 'error' ? '#fca5a5' : '#6ee7b7',
                                border: `1px solid ${statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                            }}>
                                {statusMsg.text}
                            </div>
                        )}

                        {foundUser && (
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8rem', border: '1px solid var(--color-border)', animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{foundUser.full_name}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{foundUser.email}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.8rem',
                                            background: 'var(--color-primary)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            {foundUser.tier}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                            Usage: {foundUser.usage || 0} searches
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Change Subscription Tier:</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['free', 'pro', 'elite', 'custom'].map(tier => (
                                            <button
                                                key={tier}
                                                onClick={() => handleUpdateTier(tier)}
                                                disabled={loading || foundUser.tier === tier}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    background: foundUser.tier === tier ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--color-border)',
                                                    color: 'white',
                                                    opacity: foundUser.tier === tier ? 1 : 0.7,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
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
