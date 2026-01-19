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
    const [error, setError] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (parsedUser.email !== ADMIN_EMAIL) {
                router.push('/')
                return
            }
            setUser(parsedUser)
            fetchData(parsedUser.email)
        } else {
            router.push('/login')
        }
    }, [])

    const fetchData = async (email) => {
        setLoading(true)
        try {
            const [lRes, rRes] = await Promise.all([
                fetch(`/api/admin/listings?email=${email}`),
                fetch(`/api/admin/reports?email=${email}`)
            ])

            const lData = await lRes.json()
            const rData = await rRes.json()

            if (lRes.ok) setListings(lData.listings)
            if (rRes.ok) setReports(rData.reports)
        } catch (err) {
            setError('Failed to load admin data')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await fetch('/api/admin/listings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, id, status })
            })
            if (res.ok) {
                setListings(listings.map(l => l.id === id ? { ...l, status } : l))
            }
        } catch (err) {
            alert('Update failed')
        }
    }

    const handleDeleteListing = async (id) => {
        if (!confirm('Are you sure you want to delete this listing?')) return
        try {
            const res = await fetch(`/api/admin/listings?email=${user.email}&id=${id}`, { method: 'DELETE' })
            if (res.ok) setListings(listings.filter(l => l.id !== id))
        } catch (err) {
            alert('Delete failed')
        }
    }

    const handleDeleteReport = async (id) => {
        if (!confirm('Are you sure you want to delete this report?')) return
        try {
            const res = await fetch(`/api/admin/reports?email=${user.email}&id=${id}`, { method: 'DELETE' })
            if (res.ok) setReports(reports.filter(r => r.id !== id))
        } catch (err) {
            alert('Delete failed')
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
                </div>

                {activeTab === 'listings' ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {listings.map(l => (
                            <div key={l.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{l.business_name}</h3>
                                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{l.website_url}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: l.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: l.status === 'active' ? '#10b981' : 'white' }}>
                                            {l.status.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Expires: {l.expires_at || 'Never'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {l.status !== 'active' && <button onClick={() => handleUpdateStatus(l.id, 'active')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Approve</button>}
                                    {l.status === 'active' && <button onClick={() => handleUpdateStatus(l.id, 'expired')} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Expire</button>}
                                    <button onClick={() => handleDeleteListing(l.id)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>Delete</button>
                                </div>
                            </div>
                        ))}
                        {listings.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No ad listings found.</p>}
                    </div>
                ) : (
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
                )}
            </section>
        </main>
    )
}
