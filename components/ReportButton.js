"use client"
import { useState } from 'react'

export default function ReportButton({ url = '', type = 'General', reason = 'Suspicious Activity' }) {
    const [showModal, setShowModal] = useState(false)
    const [reported, setReported] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        url: url,
        reason: reason,
        type: type
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                setReported(true)
                setShowModal(false)
            }
        } catch (e) {
            console.error('Report failed:', e)
        } finally {
            setLoading(false)
        }
    }

    if (reported) {
        return <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✅ Reported</span>
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="btn"
                style={{ background: 'var(--color-danger)', border: 'none', minWidth: '120px' }}
            >
                🚩 Report Site
            </button>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '500px',
                        width: '100%',
                        padding: '2rem',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)'
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Report Suspicious Activity</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    Website / Number / Business Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="e.g. example.com or +27123456789"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '0.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--color-border)',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    Report Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '0.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--color-border)',
                                        color: 'white'
                                    }}
                                >
                                    <option value="Website">Website</option>
                                    <option value="Email">Email</option>
                                    <option value="Phone">Phone Number</option>
                                    <option value="Business">Business</option>
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    Reason for Report
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Describe why you're reporting this..."
                                    required
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '0.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--color-border)',
                                        color: 'white',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn"
                                    style={{ flex: 1, background: 'var(--color-border)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn"
                                    style={{ flex: 1, background: 'var(--color-danger)', border: 'none' }}
                                >
                                    {loading ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
