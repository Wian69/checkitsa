
"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function BusinessReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ businessName: '', businessEmail: '', rating: 5, title: '', content: '', reviewerName: '' })

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/reviews')
            const data = await res.json()
            setReviews(data.reviews || [])
            setError(null)
        } catch (e) {
            console.error('Fetch Reviews Error:', e)
            setError('Failed to load reviews.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReviews()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        // Get logged in user email if available
        let reviewerEmail = null
        try {
            const u = localStorage.getItem('checkitsa_user')
            if (u) reviewerEmail = JSON.parse(u).email
        } catch (e) { }

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                body: JSON.stringify({ ...form, reviewerEmail })
            })
            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.message || 'Failed to submit review')
            }
            setShowModal(false)
            setForm({ businessName: '', businessEmail: '', rating: 5, title: '', content: '', reviewerName: '' })
            await fetchReviews()
        } catch (e) {
            alert('Error: ' + e.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="container section-padding" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Business <span className="gradient-text">Reviews</span>
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Real experiences from real South Africans. Verified.
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    ✍️ Write a Review
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="pulse" style={{ color: 'var(--color-text-muted)' }}>Loading verified reviews...</div>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
                    {error}
                </div>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet. Be the first!</p>
                </div>
            ) : (
                <div className="grid-responsive">
                    {reviews.map((r, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{r.business_name}</div>
                                <div style={{ color: '#fbbf24', letterSpacing: '0.1em' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                            </div>
                            <div style={{ borderLeft: `3px solid ${r.rating >= 4 ? '#22c55e' : r.rating <= 2 ? '#ef4444' : '#fbbf24'}`, paddingLeft: '1rem' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{r.title}</div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>"{r.content}"</p>
                            </div>

                            {r.response_content && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>Business Response:</div>
                                    <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>"{r.response_content}"</p>
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>👤 {r.reviewer_name || 'Anonymous'}</span>
                                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <Link href="/reviews" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    View All Public Reviews →
                </Link>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', pading: '1rem'
                }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Rate a Business</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                placeholder="Business Name"
                                required
                                style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white' }}
                                value={form.businessName}
                                onChange={e => setForm({ ...form, businessName: e.target.value })}
                            />
                            <div style={{ position: 'relative' }}>
                                <input
                                    placeholder="Business E-mail (for notifications)"
                                    type="email"
                                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white' }}
                                    value={form.businessEmail}
                                    onChange={e => setForm({ ...form, businessEmail: e.target.value })}
                                />
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '0.3rem', marginLeft: '0.5rem' }}>
                                    💡 We'll notify the business so they can respond to your feedback.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <label>Rating:</label>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setForm({ ...form, rating: star })}
                                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: star <= form.rating ? '#fbbf24' : '#555' }}
                                    >★</button>
                                ))}
                            </div>
                            <input
                                placeholder="Review Title (e.g. Great Service!)"
                                required
                                style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white' }}
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Share your experience..."
                                required
                                rows={4}
                                style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white' }}
                                value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                            />
                            <input
                                placeholder="Your Name (Optional)"
                                style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white' }}
                                value={form.reviewerName}
                                onChange={e => setForm({ ...form, reviewerName: e.target.value })}
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
