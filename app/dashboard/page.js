"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { trackSearch, getHistory, syncFromCloud } from '@/utils/searchLimit'
import Link from 'next/link'

export default function Dashboard() {
    const [stats, setStats] = useState({ count: 0, limit: 5, tier: 'free', resetType: 'lifetime' })
    const [history, setHistory] = useState({ searches: [], reports: [] })
    const [myReviews, setMyReviews] = useState([])
    const [user, setUser] = useState(null)
    const [historyPage, setHistoryPage] = useState(1)

    const fetchMyReviews = (email) => {
        fetch(`/api/reviews?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => setMyReviews(data.reviews || []))
    }

    useEffect(() => {
        // Load user first
        const u = localStorage.getItem('checkitsa_user')
        if (u) {
            const userData = JSON.parse(u)
            setUser(userData)

            // Fetch reviews
            fetchMyReviews(userData.email)

            // Fetch Preferences
            fetch(`/api/user/preferences?email=${encodeURIComponent(userData.email)}`)
                .then(res => res.json())
                .then(data => setEmailNotifications(!!data.receive_security_intel))

            // SYNC PROFILE (Fixes missing referral codes for old users)
            fetch(`/api/user/profile?email=${encodeURIComponent(userData.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUser(data.user)
                        localStorage.setItem('checkitsa_user', JSON.stringify(data.user))
                    }
                })
                .catch(err => console.error("Profile sync failed", err))

            // Perform Cloud Sync
            syncFromCloud(userData.email).then(() => {
                // After cloud sync, update UI state with fresh data
                setStats(trackSearch())

                // Also fetch reports (existing logic)
                fetch(`/api/report?email=${encodeURIComponent(userData.email)}`)
                    .then(res => res.json())
                    .then(data => {
                        setHistory({
                            searches: getHistory().searches,
                            reports: data.reports || []
                        })
                    })
            })
        } else {
            setStats(trackSearch())
            setHistory(getHistory())
        }
    }, [])

    const [emailNotifications, setEmailNotifications] = useState(false)

    const toggleNotifications = async () => {
        const newState = !emailNotifications
        setEmailNotifications(newState)
        try {
            await fetch('/api/user/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, receive_security_intel: newState })
            })
        } catch (e) {
            console.error("Failed to update preference", e)
            alert("Failed to update setting")
            setEmailNotifications(!newState) // Revert on error
        }
    }

    const [showPayoutModal, setShowPayoutModal] = useState(false)
    const [payoutLoading, setPayoutLoading] = useState(false)

    // Payout Handler - Open Modal
    const handlePayoutClick = () => {
        if (!user || user.wallet_balance < 200) {
            alert("Minimum payout amount is R200.")
            return
        }
        setShowPayoutModal(true)
    }

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return
        try {
            const res = await fetch('/api/reviews', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: reviewId, email: user.email })
            })
            if (res.ok) {
                setMyReviews(prev => prev.filter(r => r.id !== reviewId))
                alert('Review deleted.')
            } else {
                alert('Failed to delete review.')
            }
        } catch (e) {
            alert('Error deleting review.')
        }
    }

    const searchPercentage = stats.limit > 0 ? Math.min((stats.count / stats.limit) * 100, 100) : (stats.count > 0 ? 100 : 0)
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
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={() => alert("Road Sentinel is currently in development and will be coming soon!")}
                            className="btn btn-primary"
                            style={{ background: '#f59e0b', borderColor: '#f59e0b', opacity: 0.7, cursor: 'not-allowed' }}
                        >
                            🚦 Road Sentinel (Coming Soon)
                        </button>
                        {stats.tier === 'free' && (
                            <Link href="/subscription" className="btn btn-primary">
                                Upgrade Plan ⚡
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid-responsive" style={{ gap: '2rem' }}>

                    {/* Affiliate Dashboard (Pro/Elite Only) */}
                    {stats.tier !== 'free' && (
                        <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 2', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                                <span>💸</span> Affiliate Dashboard
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Your Wallet Balance</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                        R{user?.wallet_balance || 0}
                                    </div>
                                    <button onClick={handlePayoutClick} className="btn btn-outline" style={{ marginTop: '1rem', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>Request Payout</button>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '1rem', flex: 1, minWidth: '300px' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Your Referral Link (Earn 5% Commission)</div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <code style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            https://checkitsa.co.za?ref={user?.referral_code || 'generate'}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(`https://checkitsa.co.za?ref=${user?.referral_code}`)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.75rem 1.5rem' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Usage Card */}
                    <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 1' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📊</span> Usage & Quota
                        </h3>

                        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            {/* SVG Circular Progress Bar */}
                            <div style={{ width: '160px', height: '160px', position: 'relative' }}>
                                <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                                    {/* Background Circle */}
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="12"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke={isCrisis ? 'var(--color-danger)' : 'var(--color-primary)'}
                                        strokeWidth="12"
                                        strokeDasharray="440" // 2 * PI * 70 ≈ 440
                                        strokeDashoffset={440 - (440 * searchPercentage) / 100}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                    />
                                </svg>
                                {/* Centered Text */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, width: '100%', height: '100%',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.count}</span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/ {stats.limit > 1000 ? '∞' : stats.limit}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Daily Briefing</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Get 8AM security updates</div>
                                    </div>
                                    <NotificationToggle email={user?.email} />
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    <IntelFeed />
                                </ul>
                                <CommunitySources />
                            </>
                        )}
                    </div>
                </div>
            </div>


            {/* Promotion & Growth Hub */}
            <div style={{ marginTop: '3rem' }}>
                <div className="glass-panel" style={{
                    padding: '2.5rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ flex: '1', minWidth: '300px' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>🚀</span> Help Grow CheckItSA
                            </h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                The more people use our platform, the safer South Africa becomes.
                                Share your experience and prevent more people from getting scammed.
                            </p>
                        </div>
                        <div style={{ minWidth: '250px' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>📢 Spread the Word:</div>
                            <div style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)',
                                marginBottom: '1rem'
                            }}>
                                <code style={{ fontSize: '0.9rem', color: '#fff' }}>
                                    https://checkitsa.co.za
                                </code>
                            </div>
                            <button
                                onClick={() => {
                                    const msg = `⚠️ South Africans! Stop getting scammed. I use CheckItSA to verify everything before I trust it. Check it out: https://checkitsa.co.za`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                💬 Share to WhatsApp
                            </button>
                        </div>
                    </div>
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
                        <>
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
                                    {history.searches.slice((historyPage - 1) * 10, historyPage * 10).map(s => (
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
                            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={historyPage === 1}
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', opacity: historyPage === 1 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>Page {historyPage}</span>
                                <button
                                    onClick={() => setHistoryPage(p => p + 1)}
                                    disabled={historyPage * 10 >= history.searches.length}
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', opacity: historyPage * 10 >= history.searches.length ? 0.5 : 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        </>
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
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>
                                                {r.type.includes('WhatsApp') && '💬'}
                                                {r.type.includes('Social Media') && '🌐'}
                                                {r.type.includes('SMS') && '📱'}
                                                {r.type.includes('Email') && '📧'}
                                                {r.type.includes('Gambling') && '🎰'}
                                                {r.type.includes('Bank') && '🏦'}
                                            </span>
                                            {r.type}
                                        </td>
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
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                                                        try {
                                                            const res = await fetch('/api/report', {
                                                                method: 'DELETE',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id: r.id, email: user.email })
                                                            })
                                                            if (res.ok) {
                                                                setHistory(prev => ({ ...prev, reports: prev.reports.filter(item => item.id !== r.id) }))
                                                                alert('Report deleted.')
                                                            } else {
                                                                alert('Failed to delete report.')
                                                            }
                                                        } catch (e) {
                                                            console.error(e)
                                                            alert('Error deleting report.')
                                                        }
                                                    }
                                                }}
                                                className="btn"
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(220, 38, 38, 0.1)',
                                                    color: '#fca5a5',
                                                    border: '1px solid var(--color-danger)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {/* Business Review History */}
            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Business Reviews</h2>
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    {myReviews.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            You haven't submitted any business reviews yet.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Business</th>
                                    <th style={{ padding: '1rem' }}>Rating</th>
                                    <th style={{ padding: '1rem' }}>Title</th>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myReviews.map(r => (
                                    <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.business_name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ color: '#fbbf24' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{r.title}</td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleDeleteReview(r.id)}
                                                className="btn"
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(220, 38, 38, 0.1)',
                                                    color: '#fca5a5',
                                                    border: '1px solid var(--color-danger)',
                                                    cursor: 'pointer',
                                                    borderRadius: '0.5rem'
                                                }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <PayoutModal
                    user={user}
                    onClose={() => setShowPayoutModal(false)}
                    setUser={setUser}
                />
            )}
        </main >
    )
}

function PayoutModal({ user, onClose, setUser }) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState(1) // 1: Input, 2: Confirm
    const [agreed, setAgreed] = useState(false)
    const [formData, setFormData] = useState({
        bankName: '',
        accountNumber: '',
        accountType: 'Savings',
        branchCode: ''
    })

    const handleNext = (e) => {
        e.preventDefault()
        if (!formData.bankName || !formData.accountNumber) {
            setError('Please fill in required fields.')
            return
        }
        setError('')
        setStep(2)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!agreed) {
            setError('You must confirm your details to proceed.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/user/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    ...formData,
                    confirmedByUser: true
                })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess(true)
                // Update local state immediately
                setUser(prev => ({ ...prev, wallet_balance: 0 }))
                const local = JSON.parse(localStorage.getItem('checkitsa_user'))
                local.wallet_balance = 0
                localStorage.setItem('checkitsa_user', JSON.stringify(local))
            } else {
                setError(data.message || "Failed to process payout.")
            }
        } catch (e) {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, animation: 'fadeIn 0.3s ease-out'
            }}>
                <div className="glass-panel" style={{
                    width: '100%', maxWidth: '450px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    border: '1px solid var(--color-success)',
                    background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.2) 100%)'
                }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'var(--color-success)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                    }}>
                        <span style={{ fontSize: '2.5rem', color: 'white' }}>✓</span>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'white' }}>Payout Requested!</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        Your funds are on the way. Please allow up to 48 hours for admin approval (usually faster!).
                    </p>
                    <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="glass-panel hover-card" style={{
                width: '100%', maxWidth: '500px',
                padding: '2.5rem',
                border: '1px solid var(--color-border)',
                background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.9) 100%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--color-primary)' }}>💸</span> Withdraw Funds
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.5rem', padding: '0.5rem', lineHeight: 1 }}>&times;</button>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', borderRadius: '1rem', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Available Balance</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>R{user.wallet_balance?.toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '1rem' }}>CheckItSA Affiliate Program</div>
                    </div>
                    {/* Decorative Circles */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                </div>

                {error && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        ⚠️ {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleNext}>
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Bank Name</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        required
                                        className="input"
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                                            color: 'white', fontSize: '1rem', outline: 'none',
                                            appearance: 'none'
                                        }}
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    >
                                        <option value="" style={{ color: 'black' }}>Select Bank...</option>
                                        <option value="FNB" style={{ color: 'black' }}>FNB</option>
                                        <option value="Capitec" style={{ color: 'black' }}>Capitec</option>
                                        <option value="Standard Bank" style={{ color: 'black' }}>Standard Bank</option>
                                        <option value="Absa" style={{ color: 'black' }}>Absa</option>
                                        <option value="Nedbank" style={{ color: 'black' }}>Nedbank</option>
                                        <option value="TymeBank" style={{ color: 'black' }}>TymeBank</option>
                                        <option value="Discovery Bank" style={{ color: 'black' }}>Discovery Bank</option>
                                        <option value="Investec" style={{ color: 'black' }}>Investec</option>
                                        <option value="Other" style={{ color: 'black' }}>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Account Number</label>
                                <input
                                    type="text"
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                                        color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
                                    }}
                                    placeholder="e.g. 1234567890"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Branch Code (Optional)</label>
                                    <input
                                        type="text"
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                                            color: 'white', fontSize: '1rem', outline: 'none'
                                        }}
                                        placeholder="Universal"
                                        value={formData.branchCode}
                                        onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Account Type</label>
                                    <select
                                        className="input"
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                                            color: 'white', fontSize: '1rem', outline: 'none',
                                            appearance: 'none'
                                        }}
                                        value={formData.accountType}
                                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    >
                                        <option value="Savings" style={{ color: 'black' }}>Savings</option>
                                        <option value="Current/Cheque" style={{ color: 'black' }}>Current/Cheque</option>
                                        <option value="Transmission" style={{ color: 'black' }}>Transmission</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', padding: '1rem', borderRadius: '0.5rem' }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2, background: 'var(--color-primary)', border: 'none', color: 'white', padding: '1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                Review & Confirm →
                            </button>
                        </div>
                    </form>
                ) : (
                    // STEP 2: CONFIRMATION
                    <form onSubmit={handleSubmit}>
                        <div style={{ textAlign: 'left', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#e5e7eb' }}>Confirm Bank Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                                <span style={{ color: '#9ca3af' }}>Bank:</span> <strong style={{ color: 'white' }}>{formData.bankName}</strong>
                                <span style={{ color: '#9ca3af' }}>Account:</span> <strong style={{ color: 'white' }}>{formData.accountNumber}</strong>
                                <span style={{ color: '#9ca3af' }}>Type:</span> <strong style={{ color: 'white' }}>{formData.accountType}</strong>
                                <span style={{ color: '#9ca3af' }}>Branch:</span> <strong style={{ color: 'white' }}>{formData.branchCode || 'Universal'}</strong>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '0.75rem', fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.5 }}>
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={e => setAgreed(e.target.checked)}
                                    style={{ marginTop: '0.25rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--color-primary)' }}
                                />
                                <span>
                                    I confirm that the details above are correct. I understand that <strong>CheckItSA will not be liable</strong> for any funds lost due to incorrect details provided by me.
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={() => setStep(1)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                ← Edit Details
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !agreed}
                                className="btn btn-primary"
                                style={{
                                    flex: 2,
                                    background: (!agreed || loading) ? 'rgba(79, 70, 229, 0.5)' : 'var(--color-primary)',
                                    opacity: (!agreed || loading) ? 0.7 : 1,
                                    border: 'none', color: 'white', padding: '1rem', borderRadius: '0.5rem', cursor: (!agreed || loading) ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                                }}
                            >
                                {loading ? 'Processing...' : 'Confirm & Withdraw'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

function IntelFeed() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/intel')
            .then(res => res.json())
            .then(data => {
                setItems(data.items || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading Intel...</li>
    if (items.length === 0) return <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent alerts.</li>

    return (
        <>
            {items.map((item, i) => (
                <li key={i} style={{ padding: '1rem', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <div style={{ fontSize: '0.8rem', color: item.color, marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.category} • {new Date(item.date).toLocaleDateString()}</span>
                        <span style={{ opacity: 0.7 }}>{item.source}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: '500' }} className="hover:underline">
                            {item.title}
                        </a>
                        <button
                            onClick={() => {
                                const msg = `⚠️ NEW SCAM ALERT: ${item.title} \n\nCheck for more safety intel on CheckItSA: https://checkitsa.co.za`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', marginLeft: '1rem' }}
                            title="Share to WhatsApp"
                        >
                            💬
                        </button>
                    </div>
                </li>
            ))}
        </>
    )
}

function CommunitySources() {
    return (
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👥</span> Verified Community Groups
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.75rem' }}>
                    <a href="https://www.facebook.com/groups/828905211383464" target="_blank" rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: 'rgba(255,255,255,0.03)', padding: '0.75rem',
                            borderRadius: '0.5rem', textDecoration: 'none', color: 'inherit',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                        className="hover-card">
                        <span style={{ fontSize: '1.2rem' }}>🔵</span>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Scam Alert South Africa</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Facebook Community • 140k+ Members</div>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.5 }}>↗</span>
                    </a>
                </li>
            </ul>
        </div>
    )
}

function NotificationToggle({ email }) {
    const [enabled, setEnabled] = useState(true)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!email) return
        fetch(`/api/user/settings?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => setEnabled(data.notifications_enabled))
    }, [email])

    const toggle = async () => {
        setLoading(true)
        const newState = !enabled
        setEnabled(newState)
        try {
            await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, notifications_enabled: newState })
            })
        } catch (e) {
            console.error(e)
            setEnabled(!newState)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={toggle}
            disabled={loading}
            style={{
                background: enabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '1rem',
                width: '3rem',
                height: '1.5rem',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s'
            }}
        >
            <div style={{
                width: '1.1rem',
                height: '1.1rem',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '0.2rem',
                left: enabled ? '1.7rem' : '0.2rem',
                transition: 'left 0.2s'
            }}></div>
        </button>
    )
}
