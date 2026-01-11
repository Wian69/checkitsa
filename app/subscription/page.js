"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { setTier, trackSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'

export default function SubscriptionPage() {
    const router = useRouter()
    const [customSearchCount, setCustomSearchCount] = useState(2500)
    const [currentTier, setCurrentTier] = useState('free')

    useEffect(() => {
        const { tier } = trackSearch()
        setCurrentTier(tier)
    }, [])

    // Calculate Custom Price
    // Base R50 + (Count * R0.08)
    const customPrice = Math.round(50 + (customSearchCount * 0.08))

    const handleUpgrade = (tier, limit = 0) => {
        setTier(tier, limit)
        setCurrentTier(tier)
        alert(`Successfully upgraded to ${tier.toUpperCase()} plan!`)
        router.push('/')
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Upgrade for Full Access
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                        Choose a plan that fits your security needs. All plans include unlimited Gambling Verification.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto 4rem' }}>

                    {/* Free Tier */}
                    <div className="glass-panel" style={{ padding: '2rem', border: currentTier === 'free' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', position: 'relative' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Basic</h2>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Free</div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>For casual checking.</p>

                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'grid', gap: '1rem' }}>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ <strong>5 Lifetime Searches</strong></li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ Unlimited Gambling Check</li>
                            <li style={{ display: 'flex', gap: '0.5rem', opacity: 0.5 }}>❌ Daily Reset</li>
                            <li style={{ display: 'flex', gap: '0.5rem', opacity: 0.5 }}>❌ Advanced Business Reports</li>
                        </ul>

                        <button
                            className="btn"
                            style={{
                                width: '100%',
                                background: currentTier === 'free' ? 'rgba(255,255,255,0.1)' : 'var(--color-primary)',
                                cursor: currentTier === 'free' ? 'default' : 'pointer'
                            }}
                            disabled={currentTier === 'free'}
                        >
                            {currentTier === 'free' ? 'Current Plan' : 'Downgrade'}
                        </button>
                    </div>

                    {/* Pro Tier */}
                    <div className="glass-panel" style={{ padding: '2rem', border: currentTier === 'pro' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'linear-gradient(145deg, rgba(99,102,241,0.1), rgba(0,0,0,0))' }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--color-primary)', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>POPULAR</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pro</h2>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>R79 <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mo</span></div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>For safety conscious individuals.</p>

                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'grid', gap: '1rem' }}>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ <strong>100 Monthly Searches</strong></li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ <strong>Global Security Intel</strong></li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ Monthly Limit Resets</li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ Email & ID Analysis</li>
                        </ul>

                        <button
                            onClick={() => handleUpgrade('pro')}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={currentTier === 'pro'}
                        >
                            {currentTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                        </button>
                    </div>

                    {/* Elite Tier */}
                    <div className="glass-panel" style={{ padding: '2rem', border: currentTier === 'elite' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Elite</h2>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>R119 <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mo</span></div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>For power users & small biz.</p>

                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'grid', gap: '1rem' }}>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ <strong>1,000 Monthly Searches</strong></li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ <strong>Global Security Intel</strong></li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ Monthly Limit Resets</li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>✅ Exclusive Business Tools (Soon)</li>
                        </ul>

                        <button
                            onClick={() => handleUpgrade('elite')}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={currentTier === 'elite'}
                        >
                            {currentTier === 'elite' ? 'Current Plan' : 'Upgrade to Elite'}
                        </button>
                    </div>

                </div>

                {/* Custom Calculator */}
                <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Need More Power?</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Configure a custom plan tailored to your volume.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span>Monthly Searches</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{customSearchCount.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="1500"
                                max="50000"
                                step="500"
                                value={customSearchCount}
                                onChange={(e) => setCustomSearchCount(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <span>1,500</span>
                                <span>50,000+</span>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', width: '100%' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Estimated Cost</div>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>R{customPrice} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mo</span></div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Based on R50 base + R0.08 per search</div>
                        </div>

                        <button
                            onClick={() => handleUpgrade('custom', customSearchCount)}
                            className="btn btn-primary"
                            style={{ padding: '1rem 3rem' }}
                        >
                            Contact Sales & Upgrade
                        </button>
                    </div>
                </div>

            </div>
        </main>
    )
}
