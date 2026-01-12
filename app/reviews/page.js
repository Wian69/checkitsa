
"use client"
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/reviews')
            const data = await res.json()
            setReviews(data.reviews || [])
            setError(null)
        } catch (e) {
            console.error('Fetch Reviews Error:', e)
            setError('Failed to load public reviews.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReviews()
    }, [])

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem' }}>
                <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem' }}>
                        Public <span className="gradient-text">Business Reviews</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
                        Browse real experiences from the CheckItSA community. Transparent, verified, and safe.
                    </p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <div className="pulse" style={{ color: 'var(--color-text-muted)' }}>Loading public reviews...</div>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
                        {error}
                    </div>
                ) : reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet. Be the first to share an experience!</p>
                    </div>
                ) : (
                    <div className="grid-responsive">
                        {reviews.map((r, i) => (
                            <div key={i} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>{r.business_name}</h3>
                                        <div style={{ color: '#fbbf24', fontSize: '1.1rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div style={{ borderLeft: `4px solid ${r.rating >= 4 ? '#22c55e' : r.rating <= 2 ? '#ef4444' : '#fbbf24'}`, paddingLeft: '1.5rem' }}>
                                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.75rem' }}>{r.title}</strong>
                                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>"{r.content}"</p>
                                </div>

                                {r.response_content && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '1.5rem',
                                        background: 'rgba(99, 102, 241, 0.05)',
                                        borderRadius: '0.75rem',
                                        border: '1px solid rgba(99, 102, 241, 0.1)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                            💬 Business Response
                                        </div>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>
                                            "{r.response_content}"
                                        </p>
                                    </div>
                                )}

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>👤 {r.reviewer_name || 'Anonymous'}</span>
                                    {!r.response_content && (
                                        <button
                                            onClick={() => {
                                                const resp = prompt("As the business owner, enter your response to this review:")
                                                if (resp) {
                                                    fetch('/api/reviews/respond', {
                                                        method: 'POST',
                                                        body: JSON.stringify({ reviewId: r.id, responseContent: resp })
                                                    }).then(() => window.location.reload())
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            I am the business owner (Respond)
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '6rem', textAlign: 'center' }}>
                    <Link href="/" className="btn btn-outline" style={{ padding: '1rem 3rem' }}>
                        ← Back to Tools
                    </Link>
                </div>
            </div>
        </main>
    )
}
