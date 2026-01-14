"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function RespondToReview() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const reviewId = searchParams.get('id')

    const [form, setForm] = useState({ businessEmail: '', responseContent: '' })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!reviewId) {
            setError('No review specified.')
        }
    }, [reviewId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch('/api/reviews/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewId,
                    businessEmail: form.businessEmail,
                    responseContent: form.responseContent
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit response')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/')
            }, 3000)
        } catch (e) {
            setError(e.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (success) {
        return (
            <main style={{ minHeight: '100vh', padding: '10rem 2rem 2rem', textAlign: 'center' }}>
                <Navbar />
                <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✅</div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Response Posted!</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Thank you for engaging with your customers. Your response is now live.</p>
                    <p style={{ marginTop: '2rem', fontSize: '0.9rem' }}>Redirecting you back to home...</p>
                </div>
            </main>
        )
    }

    return (
        <main style={{ minHeight: '100vh', padding: '8rem 2rem 2rem' }}>
            <Navbar />
            <div className="container">
                <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Respond to Review</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        As the business owner, you can post an official response to this review.
                    </p>

                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#fca5a5' }}>
                            {error}
                        </div>
                    )}

                    {!reviewId ? (
                        <p>Invalid Link.</p>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Confirm Business Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter the email where you received the notification"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                    value={form.businessEmail}
                                    onChange={e => setForm({ ...form, businessEmail: e.target.value })}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    For security, this must match the email address associated with the review.
                                </p>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Your Response</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Thank you for your feedback..."
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                    value={form.responseContent}
                                    onChange={e => setForm({ ...form, responseContent: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary"
                                style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {submitting ? 'Posting Response...' : 'Post Response'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    )
}
