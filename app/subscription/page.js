"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

export default function Subscription() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [sdkReady, setSdkReady] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (u) {
            setUser(JSON.parse(u))
        } else {
            router.push('/login')
        }
    }, [])

    // State for Custom Slider
    const [customScans, setCustomScans] = useState(1100)
    const [customPrice, setCustomPrice] = useState(138)

    useEffect(() => {
        const price = Math.round(50 + (customScans * 0.08))
        setCustomPrice(price)
    }, [customScans])

    // Manual Fallback Loader
    const loadYocoManual = () => {
        return new Promise((resolve) => {
            if (window.YocoSDK) {
                setSdkReady(true)
                resolve(true)
                return
            }
            console.log("Attempting manual Yoco load...")
            const script = document.createElement('script')
            script.src = "https://js.yoco.com/sdk/v1/yoco-sdk-web.js"
            script.async = true
            script.onload = () => {
                setSdkReady(true)
                resolve(true)
            }
            script.onerror = () => {
                console.error("Manual Yoco load failed")
                resolve(false)
            }
            document.body.appendChild(script)
        })
    }

    const handleUpgrade = async (plan) => {
        // Optimistic Check
        if (!window.YocoSDK) {
            setLoading(true)
            // Attempt manual fallback if Next/Script failed
            const success = await loadYocoManual()
            if (!success) {
                setLoading(false)
                alert("Unable to initialize secure payment connection. Please check your internet connection and refresh the page.")
                return
            }
        }

        let amount = 0
        let desc = ''
        let limit = 0
        let planName = 'CheckItSA Premium'

        if (plan === 'pro') {
            amount = 7900
            desc = 'Pro Subscription (100 Scans)'
            planName = 'CheckItSA Pro'
        } else if (plan === 'elite') {
            amount = 11900
            desc = 'Elite Subscription (1k Scans)'
            planName = 'CheckItSA Elite'
        } else if (plan === 'custom') {
            amount = customPrice * 100
            desc = `Custom Subscription (${customScans.toLocaleString()} Scans)`
            planName = 'CheckItSA Enterprise'
            limit = customScans
        }

        try {
            const yoco = new window.YocoSDK({
                publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || 'pk_live_535be7d6Ld0qG9711634'
            })

            yoco.showPopup({
                amountInCents: amount,
                currency: 'ZAR',
                name: planName,
                description: desc,
                callback: async (result) => {
                    if (result.error) {
                        alert("Payment Failed: " + result.error.message)
                    } else {
                        setLoading(true)
                        try {
                            const res = await fetch('/api/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    token: result.id,
                                    email: user?.email,
                                    amount: amount,
                                    customLimit: limit
                                })
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.message)

                            localStorage.setItem('checkitsa_user', JSON.stringify(data.user))
                            localStorage.setItem('checkitsa_tier', data.user.tier)
                            if (limit > 0) localStorage.setItem('checkitsa_custom_limit', limit)

                            alert(`Upgrade Successful! You are now on the ${plan === 'custom' ? 'Enterprise' : plan} plan.`)
                            router.push('/dashboard')
                        } catch (err) {
                            alert("Verification Failed: " + err.message)
                            console.error(err)
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            })
        } catch (e) {
            console.error("Yoco Error", e)
            alert("Payment system error. Please try again.")
            setLoading(false)
        }
    }

    // Helper to determine active plan UI
    const isCurrentPlan = (plan) => {
        if (!user) return plan === 'basic' // Default to basic if no user loaded yet
        const tier = (user.tier || 'basic').toLowerCase()
        return tier === plan
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Primary Loader via Next.js Script */}
            <Script
                src="https://js.yoco.com/sdk/v1/yoco-sdk-web.js"
                strategy="lazyOnload"
                onLoad={() => {
                    console.log("Yoco SDK Ready via Script")
                    setSdkReady(true)
                }}
                onError={(e) => console.warn("Yoco Script Load Failed", e)}
            />

            <Navbar />

            <div className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Choose Your Plan</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Flexible options for every security need.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.5rem',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    alignItems: 'start'
                }}>
                    {/* Basic Plan */}
                    <div className="glass-panel hover-card" style={{
                        padding: '2.5rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'
                    }}>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Basic</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', letterSpacing: '-1px' }}>
                                R0 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ forever</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem', color: 'var(--color-text-muted)', lineHeight: '2', fontSize: '1rem' }}>
                                <li>✅ 5 Searches Total</li>
                                <li>✅ Basic Scanning</li>
                                <li>✅ Community Reports</li>
                                <li style={{ opacity: 0.5 }}>❌ Advanced Analysis</li>
                            </ul>
                        </div>
                        <button
                            disabled
                            className="btn btn-outline"
                            style={{
                                width: '100%',
                                opacity: isCurrentPlan('basic') ? 0.5 : 0.7,
                                cursor: 'not-allowed',
                                borderRadius: '2rem',
                                padding: '1rem',
                                borderColor: isCurrentPlan('basic') ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                                color: isCurrentPlan('basic') ? 'var(--color-success)' : 'inherit'
                            }}
                        >
                            {isCurrentPlan('basic') ? 'Current Plan' : 'Free Version'}
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="glass-panel hover-card" style={{
                        padding: '2.5rem',
                        border: '1px solid var(--color-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.2)'
                    }}>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-primary-light)', fontWeight: 600 }}>Pro</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', letterSpacing: '-1px' }}>
                                R79 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ month</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem', lineHeight: '2', fontSize: '1rem' }}>
                                <li>⚡ <strong>100 Searches / mo</strong></li>
                                <li>🛡️ <strong>Security Intel Access</strong></li>
                                <li>✅ Advanced Scanning</li>
                                <li>✅ Priority support</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleUpgrade('pro')}
                            disabled={loading || isCurrentPlan('pro')}
                            className={isCurrentPlan('pro') ? "btn btn-outline" : "btn btn-outline"}
                            style={{
                                width: '100%',
                                borderRadius: '2rem',
                                padding: '1rem',
                                opacity: isCurrentPlan('pro') ? 1 : 1,
                                borderColor: isCurrentPlan('pro') ? 'var(--color-success)' : 'var(--color-primary)',
                                color: isCurrentPlan('pro') ? 'var(--color-success)' : 'white'
                            }}
                        >
                            {loading ? 'Processing...' : (isCurrentPlan('pro') ? '✅ Current Plan' : 'Pay Now')}
                        </button>
                    </div>

                    {/* Elite Plan */}
                    <div className="glass-panel hover-card" style={{
                        padding: '2.5rem',
                        border: '2px solid var(--color-primary)',
                        background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.15) 0%, rgba(167, 139, 250, 0.1) 100%)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        justifyContent: 'space-between',
                        boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.3)'
                    }}>
                        <div>
                            <div style={{
                                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                background: 'var(--color-primary)', color: 'white', padding: '0.4rem 1.2rem',
                                borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.5px'
                            }}>BEST VALUE</div>

                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white', fontWeight: 600 }}>Elite</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                                R119 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ month</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#86efac', marginBottom: '2.5rem', fontWeight: 600 }}>🚀 Massive Capability</div>

                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem', lineHeight: '2', fontSize: '1rem' }}>
                                <li>🚀 <strong>1,000 Searches / mo</strong></li>
                                <li>🌍 <strong>Full Global Intel</strong></li>
                                <li>⚡ <strong>Fastest Execution</strong></li>
                            </ul>
                        </div>
                        <button
                            onClick={() => handleUpgrade('elite')}
                            disabled={loading || isCurrentPlan('elite')}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '2rem',
                                background: isCurrentPlan('elite') ? 'transparent' : 'var(--color-primary)',
                                border: isCurrentPlan('elite') ? '1px solid var(--color-success)' : 'none',
                                color: isCurrentPlan('elite') ? 'var(--color-success)' : 'white',
                                cursor: isCurrentPlan('elite') ? 'default' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {loading ? 'Processing...' : (isCurrentPlan('elite') ? '✅ Current Plan' : 'Pay Now')}
                        </button>
                    </div>

                    {/* Custom Plan */}
                    <div className="glass-panel hover-card" style={{ padding: '3rem', border: '1px solid rgba(255,255,255,0.1)', gridColumn: '1 / -1', maxWidth: '100%', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>Custom Enterprise</h3>
                            <p style={{ color: 'var(--color-text-muted)' }}>Tailored volume for growing agencies.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '3.5rem', fontWeight: 'bold' }}>
                                        R{customPrice} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ mo</span>
                                    </div>
                                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', fontWeight: 'bold', borderRadius: '1rem' }}>
                                        {customScans.toLocaleString()} Scans
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Adjust Verification Volume:</label>
                                    <input
                                        type="range"
                                        min="1100"
                                        max="50000"
                                        step="100"
                                        value={customScans}
                                        onChange={(e) => setCustomScans(Number(e.target.value))}
                                        style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: 'var(--color-primary)' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                        <span>1.1k</span>
                                        <span>50k+</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    color: 'var(--color-text-muted)',
                                    lineHeight: '2',
                                    fontSize: '1rem',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1rem'
                                }}>
                                    <li>✅ <strong>Volume-based Discount</strong></li>
                                    <li>✅ <strong>Dedicated API Keys</strong></li>
                                    <li>✅ <strong>Priority 24/7 Support</strong></li>
                                    <li>✅ <strong>Custom Integration</strong></li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('custom')}
                                    disabled={loading || isCurrentPlan('enterprise')}
                                    className="btn btn-outline"
                                    style={{
                                        width: '100%',
                                        marginTop: '2rem',
                                        padding: '1rem',
                                        borderRadius: '2rem',
                                        borderColor: isCurrentPlan('enterprise') ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                                        color: isCurrentPlan('enterprise') ? 'var(--color-success)' : 'inherit'
                                    }}
                                >
                                    {loading ? 'Processing...' : (isCurrentPlan('enterprise') ? '✅ Current Plan' : 'Pay Now')}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}
