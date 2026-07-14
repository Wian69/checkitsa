"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

function SuccessContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const listingId = searchParams.get('listingId')
    const checkoutId = searchParams.get('checkoutId')
    const [status, setStatus] = useState('verifying')

    useEffect(() => {
        if (listingId && checkoutId) {
            verifyPayment()
        } else {
            setStatus('error')
        }
    }, [listingId, checkoutId])

    const verifyPayment = async () => {
        try {
            const res = await fetch('/api/advertise/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId, checkoutId })
            })
            const data = await res.json()
            if (data.success) {
                setStatus('success')
                setTimeout(() => router.push('/'), 3000)
            } else {
                setStatus('error')
            }
        } catch (e) {
            setStatus('error')
        }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <section className="container" style={{ paddingTop: '10rem', textAlign: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                    {status === 'verifying' && (
                        <div>
                            <div className="spinner" style={{ margin: '0 auto 2rem' }}></div>
                            <h2>Verifying Payment...</h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>Please wait while we activate your listing.</p>
                        </div>
                    )}
                    {status === 'success' && (
                        <div>
                            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
                            <h2>Payment Successful!</h2>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                                Your business is now verified and active! Redirecting to homepage...
                            </p>
                        </div>
                    )}
                    {status === 'error' && (
                        <div>
                            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>❌</div>
                            <h2>Verification Failed</h2>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                                We could not verify your payment. If you were charged, please contact support.
                            </p>
                            <button onClick={() => router.push('/advertise')} className="btn btn-primary">Return</button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
