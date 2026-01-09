"use client"
import Navbar from '@/components/Navbar'
export const runtime = 'edge'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [tier, setTier] = useState('standard')

    useEffect(() => {
        const plan = searchParams.get('plan') || 'standard'
        setTier(plan)

        if (typeof window !== 'undefined') {
            localStorage.setItem('checkitsa_tier', plan)
            localStorage.setItem('checkitsa_searches', '0') // Reset for new plan

            // Update user object if it exists
            const userJson = localStorage.getItem('checkitsa_user')
            if (userJson) {
                const user = JSON.parse(userJson)
                user.tier = plan
                localStorage.setItem('checkitsa_user', JSON.stringify(user))
            }
        }
    }, [searchParams])

    return (
        <div className="container" style={{ paddingTop: '10rem', textAlign: 'center', maxWidth: '600px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎉</div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to {tier.charAt(0).toUpperCase() + tier.slice(1)} Protection!</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', marginBottom: '3rem' }}>
                Your subscription has been activated. You now have {(tier === 'ultimate') ? 'unlimited' : (tier === 'pro' ? '100' : '20')} scans available.
            </p>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <p style={{ fontWeight: 600, color: 'var(--color-success)', marginBottom: '0.5rem' }}>Status: {tier.toUpperCase()} ACTIVATED</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    Thank you for choosing CheckItSA for your security needs.
                </p>
            </div>

            <button onClick={() => router.push('/')} className="btn btn-primary" style={{ padding: '1rem 3rem' }}>
                Start Scanning
            </button>
        </div>
    )
}

export default function SubscriptionSuccess() {
    return (
        <main style={{ minHeight: '100vh' }}>
            <Navbar />
            <Suspense fallback={<div style={{ paddingTop: '10rem', textAlign: 'center' }}>Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </main>
    )
}
