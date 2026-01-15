"use client"
import { useState } from 'react'
import { addToReportHistory } from '@/utils/searchLimit'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function ScamReportForm() {
    const [type, setType] = useState('WhatsApp')
    const [selectedBank, setSelectedBank] = useState('FNB') // Default bank
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null)
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '',
        scammer_details: '', description: '', evidence: []
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        // Construct Type String
        const finalType = type === 'Bank' ? `Bank: ${selectedBank}` : type

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, type: finalType })
            })
            if (res.ok) {
                setStatus('success')
                addToReportHistory({
                    type: finalType + ' Scam',
                    details: formData.scammer_details
                })
                setFormData({ name: '', email: '', phone: '', scammer_details: '', description: '', evidence: [] })
            } else {
                throw new Error('Failed to submit')
            }
        } catch (error) {
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    const types = ['WhatsApp', 'Social Media', 'SMS', 'Email', 'Gambling', 'Bank']
    const banks = ['FNB', 'Standard Bank', 'Absa', 'Nedbank', 'Capitec', 'TymeBank', 'Discovery Bank', 'Investec', 'Other']

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
            {loading && <LoadingOverlay message="Submitting Report..." />}
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
                <p style={{ color: '#f59e0b', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    ⚠️ If you paid someone money, please use the <strong>Bank Scam</strong> tab below.
                </p>
            </div>

            {/* Type Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                            {t === 'Gambling' && '🎰 '}
                            {t === 'Bank' && '🏦 '}
                            {t} Scam
                        </button>
                    ))}
                </div>

                {/* Bank Selector Dropdown */}
                {type === 'Bank' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            style={{
                                padding: '0.8rem 1.5rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid var(--color-primary)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '200px'
                            }}
                        >
                            {banks.map(bank => (
                                <option key={bank} value={bank} style={{ background: '#111', color: 'white' }}>
                                    {bank}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
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
                                    {type === 'Social Media' ? 'Scammer Profile Link / Name' : (type === 'Email' ? 'Scammer Email Address' : (type === 'Gambling' ? 'Casino URL / Name' : 'Scammer Number / Sender ID'))}
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder={
                                        type === 'Social Media' ? 'e.g. facebook.com/scammer123' :
                                            type === 'Email' ? 'e.g. scammer@gmail.com' :
                                                type === 'Gambling' ? 'e.g. illegalcasino.com' :
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Upload Evidence (Optional - Max 4)
                            </label>
                            <div style={{
                                border: '2px dashed var(--color-border)',
                                padding: '2rem',
                                borderRadius: '0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)',
                                transition: 'border-color 0.2s',
                                position: 'relative'
                            }}
                                onClick={() => {
                                    if (formData.evidence.length < 4) {
                                        document.getElementById('evidence-upload').click()
                                    } else {
                                        alert("Maximum 4 images allowed.")
                                    }
                                }}
                            >
                                <input
                                    id="evidence-upload"
                                    type="file"
                                    accept="image/*"
                                    // multiple // Single add for better compression control
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                            if (formData.evidence.length >= 4) {
                                                alert("Maximum 4 images allowed.")
                                                return
                                            }
                                            // Compression Logic
                                            const reader = new FileReader()
                                            reader.onload = (event) => {
                                                const img = new Image()
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas')
                                                    const MAX_WIDTH = 800
                                                    const MAX_HEIGHT = 800
                                                    let width = img.width
                                                    let height = img.height

                                                    if (width > height) {
                                                        if (width > MAX_WIDTH) {
                                                            height *= MAX_WIDTH / width
                                                            width = MAX_WIDTH
                                                        }
                                                    } else {
                                                        if (height > MAX_HEIGHT) {
                                                            width *= MAX_HEIGHT / height
                                                            height = MAX_HEIGHT
                                                        }
                                                    }

                                                    canvas.width = width
                                                    canvas.height = height
                                                    const ctx = canvas.getContext('2d')
                                                    ctx.drawImage(img, 0, 0, width, height)

                                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                                                    // Append to array
                                                    setFormData(prev => ({ ...prev, evidence: [...(prev.evidence || []), dataUrl] }))
                                                    // Reset input value to allow adding same file twice if needed? Nah, just to clear it
                                                    e.target.value = ''
                                                }
                                                img.src = event.target.result
                                            }
                                            reader.readAsDataURL(file)
                                        }
                                    }}
                                />

                                {(!formData.evidence || formData.evidence.length === 0) ? (
                                    <div>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
                                        <p style={{ color: 'var(--color-text-muted)' }}>Click to upload screenshot (Max 4)</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                        {/* Thumbnails */}
                                        {formData.evidence.map((imgSrc, idx) => (
                                            <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.25rem', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                                <img src={imgSrc} alt={`Evidence ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            evidence: prev.evidence.filter((_, i) => i !== idx)
                                                        }))
                                                    }}
                                                    style={{
                                                        position: 'absolute', top: '2px', right: '2px',
                                                        background: 'rgba(220, 38, 38, 0.9)', color: 'white',
                                                        border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', fontSize: '10px'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        {formData.evidence.length < 4 && (
                                            <div
                                                onClick={() => document.getElementById('evidence-upload').click()}
                                                style={{
                                                    border: '2px dashed var(--color-border)',
                                                    borderRadius: '0.25rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.5rem',
                                                    color: 'var(--color-text-muted)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                +
                                            </div>
                                        )}
                                    </div>
                                )}
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
