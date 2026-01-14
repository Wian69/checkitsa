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
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {(user?.tier === 'elite' || user?.tier === 'custom' || user?.tier === 'ultimate') && (
                            <Link href="/dashboard/developer" className="btn btn-outline" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                                👨‍💻 Developer API
                            </Link>
                        )}
                        {stats.tier === 'free' && (
                            <Link href="/subscription" className="btn btn-primary">
                                Upgrade Plan ⚡
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid-responsive" style={{ gap: '2rem' }}>

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
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    <IntelFeed />
                                </ul>
                                <CommunitySources />
                            </>
                        )}
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

            </div>
        </main>
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

