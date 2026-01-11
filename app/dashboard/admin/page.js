"use client"
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
    const [user, setUser] = useState(null)
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (!u) {
            router.push('/login')
            return
        }
        const parsedUser = JSON.parse(u)
        setUser(parsedUser)

        if (parsedUser.tier !== 'elite' && parsedUser.tier !== 'ultimate') {
            alert("Access Denied: Admins Only")
            router.push('/dashboard')
            return
        }

        fetchReports(parsedUser.email)
    }, [])

    const fetchReports = async (email) => {
        try {
            const res = await fetch(`/api/admin/reports?email=${email}`)
            const data = await res.json()
            setReports(data.reports || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id, status) => {
        setReports(reports.filter(r => r.id !== id)) // Optimistic UI update
        try {
            await fetch('/api/admin/reports', {
                method: 'PUT',
                body: JSON.stringify({ id, status, email: user.email })
            })
        } catch (e) {
            alert("Action failed")
            fetchReports(user.email) // Revert
        }
    }

    if (!user) return null

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '8rem', maxWidth: '1200px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Admin Report Queue</h1>

                {loading ? (
                    <div>Loading...</div>
                ) : reports.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        <h3>All caught up! 🎉</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>No pending reports.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {reports.map((report) => (
                            <div key={report.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'start', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span className="badge badge-warning">{report.scam_type}</span>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{new Date(report.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 style={{ marginBottom: '0.5rem' }}>{report.scammer_details}</h3>
                                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{report.description}</p>

                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <strong>Reporter:</strong> {report.reporter_name} ({report.reporter_email})
                                    </div>

                                    {report.evidence_image && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <a href={report.evidence_image} target="_blank" style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>View Evidence Attachment 📎</a>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                                    <button
                                        onClick={() => handleAction(report.id, 'verified')}
                                        className="btn btn-success"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        ✅ Verify
                                    </button>
                                    <button
                                        onClick={() => handleAction(report.id, 'rejected')}
                                        className="btn btn-danger"
                                        style={{ width: '100%', justifyContent: 'center', background: 'rgba(220, 38, 38, 0.2)', border: '1px solid var(--color-danger)' }}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
