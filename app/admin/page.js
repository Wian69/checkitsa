"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const ADMIN_EMAIL = 'wiandurandt69@gmail.com'

export default function AdminDashboard() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('listings')
    const [listings, setListings] = useState([])
    const [reports, setReports] = useState([])
    // Invitation State
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteName, setInviteName] = useState('')
    const [sendingInvite, setSendingInvite] = useState(false)

    // ... existing handlers ...

    const handleSendInvite = async (e) => {
        e.preventDefault()
        setSendingInvite(true)
        try {
            const res = await fetch(`/api/admin/invite?test_email=${inviteEmail}`)
            const data = await res.json()
            if (res.ok) {
                alert(`Invitation sent to ${inviteEmail}!`)
                setInviteEmail('')
                setInviteName('')
            } else {
                alert('Failed to send: ' + JSON.stringify(data))
            }
        } catch (err) {
            alert('Error sending invitation')
        } finally {
            setSendingInvite(false)
        }
    }

    if (loading) return <div style={{ color: 'white', textAlign: 'center', paddingTop: '10rem' }}>Loading Admin Panel...</div>

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <section className="container" style={{ paddingTop: '8rem' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Control Center</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Managed by {ADMIN_EMAIL}</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('listings')}
                        style={{
                            background: 'none', border: 'none', color: activeTab === 'listings' ? 'var(--color-primary)' : 'white',
                            fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                            borderBottom: activeTab === 'listings' ? '2px solid var(--color-primary)' : 'none',
                            paddingBottom: '0.5rem'
                        }}
                    >
                        Business Ads ({listings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        style={{
                            background: 'none', border: 'none', color: activeTab === 'reports' ? 'var(--color-primary)' : 'white',
                            fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                            borderBottom: activeTab === 'reports' ? '2px solid var(--color-primary)' : 'none',
                            paddingBottom: '0.5rem'
                        }}
                    >
                        Community Reports ({reports.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('invites')}
                        style={{
                            background: 'none', border: 'none', color: activeTab === 'invites' ? 'var(--color-primary)' : 'white',
                            fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                            borderBottom: activeTab === 'invites' ? '2px solid var(--color-primary)' : 'none',
                            paddingBottom: '0.5rem'
                        }}
                    >
                        Send Invitations 📧
                    </button>
                </div>

                {activeTab === 'listings' ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {listings.map(l => (
                            <div key={l.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{l.business_name}</h3>
                                        <p style={{ margin: '0.2rem 0', fontSize: '0.95rem', color: 'var(--color-primary)' }}>{l.website_url}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: l.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: l.status === 'active' ? '#10b981' : 'white', fontWeight: 'bold' }}>
                                                {l.status.toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>CIPC: {l.registration_number || 'N/A'}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', marginLeft: '0.5rem' }}>🖱️ {l.click_count || 0} Clicks</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>• Expires: {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Never'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {l.status !== 'active' && <button onClick={() => handleUpdateStatus(l.id, 'active')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Approve</button>}
                                        {l.status === 'active' && <button onClick={() => handleUpdateStatus(l.id, 'expired')} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Expire</button>}
                                        <button onClick={() => handleDeleteListing(l.id)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>Delete</button>
                                    </div>
                                </div>

                                {l.images && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                                        {JSON.parse(l.images).map((img, idx) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" style={{ aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--color-border)', display: 'block' }}>
                                                <img src={img} alt="Business Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {listings.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No ad listings found.</p>}
                    </div>
                ) : activeTab === 'reports' ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {reports.map(r => (
                            <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{r.type?.toUpperCase()}</span>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{r.url}</h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{r.reason}</p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.5rem' }}>Reported on: {new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleDeleteReport(r.id)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>Resolve / Clear</button>
                                </div>
                            </div>
                        ))}
                        {reports.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No community reports found.</p>}
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Send Verification Invite</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            Send a professional email invitation to businesses, urging them to verify their status on CheckItSA.
                        </p>
                        <form onSubmit={handleSendInvite}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Business Name</label>
                                <input
                                    type="text"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    placeholder="e.g. Acme Security"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="contact@business.co.za"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sendingInvite}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                            >
                                {sendingInvite ? 'Sending...' : 'Send Invitation 🚀'}
                            </button>
                            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                Creates a verified sender invitation using Cloudflare & Brevo.
                            </p>
                        </form>
                    </div>
                )}
            </section>
        </main>
    )
}
