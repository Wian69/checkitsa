"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { trackSearch, getHistory, syncFromCloud } from '@/utils/searchLimit'
import Link from 'next/link'
import Script from 'next/script'

export default function Dashboard() {
    const [stats, setStats] = useState({ count: 0, limit: 5, tier: 'free', resetType: 'lifetime' })
    const [history, setHistory] = useState({ searches: [], reports: [] })
    const [myReviews, setMyReviews] = useState([])
    const [myAds, setMyAds] = useState([])
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

            // Fetch My Ads
            fetch(`/api/user/listings?email=${encodeURIComponent(userData.email)}`)
                .then(res => res.json())
                .then(data => setMyAds(data.listings || []))

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
    const [managingListing, setManagingListing] = useState(null) // New state for modal
    const [editingListing, setEditingListing] = useState(null) // New state for edit modal

    // Payout Handler
    const handlePayoutClick = () => {
        if (!user || user.wallet_balance < 200) {
            alert("Minimum payout amount is R200.")
            return
        }
        setShowPayoutModal(true)
    }

    // Renewal Handler
    const handleRenew = (listing) => {
        if (typeof window.YocoSDK === 'undefined') {
            alert('Yoco SDK not loaded. Please refresh.')
            return
        }

        const yoco = new window.YocoSDK({
            publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY
        })

        yoco.showPopup({
            amountInCents: 9900,
            currency: 'ZAR',
            name: 'Ad Renewal',
            description: `Renewing ${listing.business_name} for 30 days`,
            callback: async (result) => {
                if (result.error) {
                    alert("Payment Failed: " + result.error.message)
                } else {
                    // Send token to backend
                    try {
                        const res = await fetch('/api/advertise/renew', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ listingId: listing.id, token: result.id })
                        })

                        if (res.ok) {
                            alert("Success! Your ad is active again.")
                            // Optimistic Update
                            setMyAds(prev => prev.map(ad => ad.id === listing.id ? { ...ad, status: 'active' } : ad))
                        } else {
                            alert("Renewal failed after payment. Please contact support.")
                        }

                    } catch (err) {
                        alert("Error processing renewal.")
                    }
                }
            }
        })
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

                <Script src="https://js.yoco.com/sdk/v1/yoco-sdk-web.js" />


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

                {/* My Ad Listings */}
                <div style={{ marginTop: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>🚀</span> My Ad Listings
                            </h3>
                            <Link href="/advertise" className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Create New Ad</Link>
                        </div>

                        {myAds.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '1rem' }}>
                                <p>You haven't promoted any businesses yet.</p>
                                <Link href="/advertise" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>Start Advertising →</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {myAds.map(ad => (
                                    <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{ad.business_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{ad.category} • {ad.website_url}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            {ad.status === 'active' ? (
                                                <>
                                                    <button
                                                        onClick={() => setManagingListing(ad)}
                                                        className="btn btn-outline"
                                                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                                                    >
                                                        📦 Manage Products
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingListing(ad)}
                                                        className="btn btn-outline"
                                                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                </>
                                            ) : ad.status === 'expired' ? (
                                                <button
                                                    onClick={() => handleRenew(ad)}
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#3b82f6', borderColor: '#3b82f6' }}
                                                >
                                                    🔄 Renew (R99)
                                                </button>
                                            ) : null}

                                            <div>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '4px',
                                                    background: ad.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                                    color: ad.status === 'active' ? '#10b981' : 'white',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 'bold',
                                                    display: 'block',
                                                    marginBottom: '0.2rem'
                                                }}>
                                                    {ad.status}
                                                </span>
                                                {ad.expires_at && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                        Ends: {new Date(ad.expires_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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


                {/* ADMIN SHORTCUTS - ADDED MANUAL OVERRIDE */}
                {
                    user && user.email === 'wiandurandt69@gmail.com' && (
                        <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f87171' }}>Admin Keypad</h2>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Link href="/admin/leads" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: '#dc2626', color: 'white', textDecoration: 'none',
                                    padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold'
                                }}>
                                    📢 Manage Leads & Invites
                                </Link>
                            </div>
                        </div>
                    )
                }

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
                {
                    showPayoutModal && (
                        <PayoutModal
                            user={user}
                            onClose={() => setShowPayoutModal(false)}
                            setUser={setUser}
                        />
                    )
                }

                {/* Product Manager Modal */}
                {
                    managingListing && (
                        <ProductManagerModal
                            user={user}
                            listing={managingListing}
                            onClose={() => setManagingListing(null)}
                        />
                    )
                }

                {/* Edit Listing Modal */}
                {
                    editingListing && (
                        <EditListingModal
                            user={user}
                            listing={editingListing}
                            onClose={() => setEditingListing(null)}
                            onUpdate={(updatedDetails) => {
                                setMyAds(prev => prev.map(ad => ad.id === editingListing.id ? { ...ad, ...updatedDetails } : ad))
                                setEditingListing(null)
                            }}
                        />
                    )
                }
            </div >
        </main >
    )
}



// --- Edit Listing Modal ---
function EditListingModal({ user, listing, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        business_name: listing.business_name,
        website_url: listing.website_url,
        description: listing.description,
        category: listing.category,
        registration_number: listing.registration_number
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/advertise/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId: listing.id,
                    email: user.email,
                    ...formData
                })
            })

            if (res.ok) {
                alert("Listing updated successfully!")
                onUpdate(formData)
            } else {
                alert("Failed to update listing.")
            }
        } catch (err) {
            console.error(err)
            alert("Error updating listing.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '500px',
                padding: '2rem',
                background: '#111', border: '1px solid var(--color-border)'
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Edit Listing</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Business Name</label>
                        <input
                            type="text"
                            value={formData.business_name}
                            onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Registration Number</label>
                        <input
                            type="text"
                            value={formData.registration_number}
                            onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', background: '#111', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'white' }}
                        >
                            <option value="Security">Security</option>
                            <option value="Finance">Finance</option>
                            <option value="Legal">Legal</option>
                            <option value="Retail">Retail</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Automotive">Automotive</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Technology">Technology</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Website URL</label>
                        <input
                            type="url"
                            value={formData.website_url}
                            onChange={e => setFormData({ ...formData, website_url: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'white', height: '100px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- Product Management Modal ---
function ProductManagerModal({ user, listing, onClose }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('list') // 'list' or 'add'

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
        category: 'Product',
        images: [] // Changed from image_url to images array
    })
    const [submitting, setSubmitting] = useState(false)

    // Load Products
    useEffect(() => {
        fetch(`/api/user/products?listing_id=${listing.id}`)
            .then(res => res.json())
            .then(data => {
                setProducts(data.products || [])
                setLoading(false)
            })
    }, [listing.id])

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        if (formData.images.length + files.length > 20) {
            alert("Maximum 20 images allowed.")
            return
        }

        const newImages = []
        let processed = 0

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert(`File ${file.name} is too large. Max 5MB.`)
                processed++
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                newImages.push(reader.result)
                processed++
                if (processed === files.length) {
                    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
                }
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/user/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    listing_id: listing.id,
                    ...formData,
                    price: parseFloat(formData.price) || 0
                })
            })

            if (res.ok) {
                // Refresh list
                const newProduct = { ...formData, id: Date.now(), price: parseFloat(formData.price), image_url: JSON.stringify(formData.images) } // Optimistic update
                setProducts([newProduct, ...products])
                setView('list') // Go back to list
                setFormData({ title: '', price: '', description: '', category: 'Product', images: [] }) // Reset
            } else {
                alert("Failed to add product.")
            }
        } catch (err) {
            console.error(err)
            alert("Error adding product.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (productId) => {
        if (!confirm("Are you sure you want to delete this item?")) return

        try {
            const res = await fetch('/api/user/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    product_id: productId
                })
            })
            if (res.ok) {
                setProducts(products.filter(p => p.id !== productId))
            }
        } catch (err) {
            alert("Failed to delete.")
        }
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '800px', height: '90vh',
                display: 'flex', flexDirection: 'column',
                padding: '0', overflow: 'hidden',
                background: '#111', border: '1px solid var(--color-border)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Using: {listing.business_name}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Manage Products & Listings</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

                    {view === 'list' ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem' }}>Your Catalog ({products.length})</h3>
                                <button onClick={() => setView('add')} className="btn btn-primary">
                                    + Add New Item
                                </button>
                            </div>

                            {loading ? (
                                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading...</div>
                            ) : products.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--color-border)', borderRadius: '1rem', color: 'var(--color-text-muted)' }}>
                                    No products listed yet. Click "Add New Item" to start selling.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {products.map(p => (
                                        <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                            <div style={{ height: '120px', background: '#000' }}>
                                                {(() => {
                                                    let img = p.image_url;
                                                    try {
                                                        const parsed = JSON.parse(p.image_url);
                                                        if (Array.isArray(parsed)) img = parsed[0];
                                                    } catch (e) { }
                                                    return img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null;
                                                })()}
                                            </div>
                                            <div style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 'bold' }}>{p.title}</div>
                                                <div style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>R{p.price}</div>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="btn"
                                                    style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.25rem', background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <button onClick={() => setView('list')} className="btn" style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', paddingLeft: 0 }}>
                                ← Back to List
                            </button>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Add New Item</h3>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Category</label>
                                    <select
                                        className="input"
                                        style={{ width: '100%', background: '#222', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Product</option>
                                        <option>Property (Sale)</option>
                                        <option>Property (Rent)</option>
                                        <option>Vehicle</option>
                                        <option>Service</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Item Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 3 Bedroom House"
                                        style={{ width: '100%', background: '#222', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Price (R)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        style={{ width: '100%', background: '#222', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Describe your item..."
                                        style={{ width: '100%', background: '#222', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Photos (Up to 20)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        style={{ color: 'var(--color-text-muted)' }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', height: '80px', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    style={{
                                                        position: 'absolute', top: 0, right: 0,
                                                        background: 'rgba(0,0,0,0.7)', color: 'white',
                                                        border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary"
                                    style={{ marginTop: '1rem', padding: '1rem', justifyContent: 'center' }}
                                >
                                    {submitting ? 'Creating...' : 'Create Listing'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
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
