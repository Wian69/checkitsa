"use client"
import { useState } from 'react'

export default function ScamReportForm() {
    const [type, setType] = useState('WhatsApp')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null)
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '',
        scammer_details: '', description: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, type })
            })
            if (res.ok) {
                setStatus('success')
                setFormData({ name: '', email: '', phone: '', scammer_details: '', description: '' })
            } else {
                throw new Error('Failed to submit')
            }
        } catch (error) {
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    const types = ['WhatsApp', 'Social Media', 'SMS', 'Email']

    const inputStyle = {
        width: '100%',
        padding: '0.8rem',
        borderRadius: '0.5rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--color-border)',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    }

    return (
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Report a Scam Incident
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                    Help the community by reporting recent scam attempts. Your report could save someone else.
                </p>
            </div>

            {/* Type Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                {types.map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '2rem',
                            fontWeight: 600,
                            letterSpacing: '0.025em',
                            border: type === t ? 'none' : '1px solid var(--color-border)',
                            background: type === t ? 'var(--color-primary)' : 'transparent',
                            color: type === t ? 'white' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: type === t ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: type === t ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none'
                        }}
                    >
                        {t === 'WhatsApp' && '💬 '}
                        {t === 'Social Media' && '🌐 '}
                        {t === 'SMS' && '📱 '}
                        {t === 'Email' && '📧 '}
                        {t} Scam
                    </button>
                ))}
            </div>

            {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', animation: 'fadeIn 0.5s ease' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
                    <h3 style={{ fontSize: '2rem', color: 'var(--color-success)', marginBottom: '1rem' }}>Report Submitted!</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Thank you for helping keep South Africa safe.</p>
                    <button onClick={() => setStatus(null)} className="btn btn-outline">Report another incident</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                    {/* User Details */}
                    <div>
                        <h3 style={{
                            fontSize: '1.25rem',
                            color: 'var(--color-primary-light)',
                            borderBottom: '1px solid var(--color-border)',
                            paddingBottom: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            1. Your Details (Kept Private)
                        </h3>
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Name</label>
                                <input
                                    required
                                    type="text"
                                    style={inputStyle}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Email</label>
                                <input
                                    required
                                    type="email"
                                    style={inputStyle}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    style={inputStyle}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Incident Details */}
                    <div>
                        <h3 style={{
                            fontSize: '1.25rem',
                            color: '#f87171',
                            borderBottom: '1px solid var(--color-border)',
                            paddingBottom: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            2. Incident Details
                        </h3>
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {type === 'Social Media' ? 'Scammer Profile Link / Name' : (type === 'Email' ? 'Scammer Email Address' : 'Scammer Number / Sender ID')}
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder={
                                        type === 'Social Media' ? 'e.g. facebook.com/scammer123' :
                                            type === 'Email' ? 'e.g. scammer@gmail.com' :
                                                'e.g. +27 12 345 6789'
                                    }
                                    style={inputStyle}
                                    value={formData.scammer_details}
                                    onChange={e => setFormData({ ...formData, scammer_details: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Description of Incident</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="What happened? What did they ask for? Please provide as much detail as possible."
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <button
                            disabled={loading}
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-dark))'
                            }}
                        >
                            {loading ? 'Submitting Report...' : 'Submit Scam Report'}
                        </button>
                        {status === 'error' && (
                            <p style={{ color: 'var(--color-danger)', textAlign: 'center', marginTop: '1rem' }}>
                                Error submitting report. Please try again.
                            </p>
                        )}
                    </div>
                </form>
            )}
        </div>
    )
}
