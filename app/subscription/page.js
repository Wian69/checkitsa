"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Subscription() {
    const [user, setUser] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (u) setUser(JSON.parse(u))
    }, [])

    const plans = [
        {
            name: 'Free',
            price: 'R0',
            features: ['1-Time Search', 'Basic Gambling Check', 'Registration Required'],
            limit: '1 search',
            tier: 'guest'
        },
        {
            name: 'Standard',
            price: 'R99',
            period: '/month',
            features: ['20 Scans / month', 'Risk Analysis', 'Email Support'],
            link: 'https://pay.yoco.com/r/7XrDrG',
            tier: 'standard'
        },
        {
            name: 'Pro Protection',
            price: 'R149',
            period: '/month',
            features: ['100 Scans / month', 'Full ID Verification', 'Business Verification', 'Priority Support'],
            recommended: true,
            link: 'https://pay.yoco.com/r/mOExGp',
            tier: 'pro'
        },
        {
            name: 'Ultimate',
            price: 'R495',
            period: '/month',
            features: ['Unlimited Scans', 'Deep AI Analysis', 'API Access', '24/7 Premium Support'],
            link: 'https://pay.yoco.com/r/70jQjJ',
            tier: 'ultimate'
        }
    ]

    return (
        <main style={{ minHeight: '100vh' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', paddingBottom: '6rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem', lineHeight: 1.1 }}>Investment in Security</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        Start for free, upgrade when you need bulletproof protection.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {plans.map((plan) => (
                        <div key={plan.name} className="glass-panel" style={{
                            padding: '2rem',
                            border: plan.recommended ? '1.5px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {plan.recommended && (
                                <div style={{
                                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                    background: 'var(--color-primary)', padding: '0.25rem 1rem', borderRadius: '99px', fontSize: '0.875rem', fontWeight: 600
                                }}>
                                    Most Popular
                                </div>
                            )}

                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                                {plan.price}<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>{plan.period}</span>
                            </div>

                            <ul style={{ marginBottom: '2rem', listStyle: 'none', flex: 1 }}>
                                {plan.features.map(f => (
                                    <li key={f} style={{ marginBottom: '0.6rem', display: 'flex', gap: '0.6rem', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--color-success)' }}>✓</span> {f}
                                    </li>
                                ))}
                            </ul>

                            <div style={{ marginTop: 'auto' }}>
                                {plan.name === 'Free' ? (
                                    <button
                                        onClick={() => router.push('/signup')}
                                        className="btn btn-outline"
                                        style={{ width: '100%' }}
                                    >
                                        {user ? 'Current Plan' : 'Get Started'}
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <a
                                            href={`${plan.link}?plan=${plan.tier}`}
                                            className="btn btn-primary"
                                            style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                                        >
                                            Subscribe Now
                                        </a>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Secure payment via </span>
                                            <span style={{ fontWeight: 700, fontSize: '0.7rem' }}>Yoco</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
