"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Subscription() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [sdkReady, setSdkReady] = useState(false)
    const [sdkError, setSdkError] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Load User
        const u = localStorage.getItem('checkitsa_user')
        if (u) {
            setUser(JSON.parse(u))
        } else {
            router.push('/login')
        }

        // Load Yoco SDK Robustly
        if (window.YocoSDK) {
            setSdkReady(true)
        } else {
            // Check if script already exists to avoid duplicates/race conditions
            const existingScript = document.querySelector('script[src="https://js.yoco.com/sdk/v1/yoco-sdk-web.js"]')

            if (existingScript) {
                // If it exists but sdkReady is false, check if it's loaded
                if (window.YocoSDK) {
                    setSdkReady(true)
                } else {
                    // Attach listener to existing script just in case
                    existingScript.addEventListener('load', () => setSdkReady(true))
                }
            } else {
                const script = document.createElement('script')
                script.src = "https://js.yoco.com/sdk/v1/yoco-sdk-web.js"
                script.async = true
                script.onload = () => {
                    console.log("Yoco SDK Loaded")
                    setSdkReady(true)
                }
                script.onerror = () => {
                    console.error("Failed to load Yoco SDK")
                    alert("Failed to load payment system. Please disable ad-blockers and refresh.")
                }
                document.body.appendChild(script)
            }
        }
        // Verification: Intentionally NOT determining cleanup of script to ensure it stays loaded

        // Polling fallback in case event listeners are missed
        const timer = setInterval(() => {
            if (window.YocoSDK && !sdkReady) {
                setSdkReady(true)
                clearInterval(timer)
            }
        }, 500)

        // Cleanup interval on unmount
        return () => clearInterval(timer)
    }, [])

    // State for Custom Slider
    const [customScans, setCustomScans] = useState(1100)
    const [customPrice, setCustomPrice] = useState(138) // Initial calculation

    // Update price when slider moves
    useEffect(() => {
        // Formula: Base R50 + (Scans * R0.08)
        const price = Math.round(50 + (customScans * 0.08))
        setCustomPrice(price)
    }, [customScans])


    const handleUpgrade = (plan) => {
        if (!sdkReady || !window.YocoSDK) {
            console.warn("Attempted upgrade before SDK ready")
            return
        }

        // Pricing Logic
        let amount = 0
        let desc = ''
        let limit = 0

        let planName = 'CheckItSA Premium'

        if (plan === 'pro') {
            amount = 7900 // R79.00
            desc = 'Pro Subscription (100 Scans)'
            planName = 'CheckItSA Pro'
        } else if (plan === 'elite') {
            amount = 11900 // R119.00
            desc = 'Elite Subscription (1k Scans)'
            planName = 'CheckItSA Elite'
        } else if (plan === 'custom') {
            amount = customPrice * 100 // Convert to cents
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
                                    email: user.email,
                                    amount: amount,
                                    customLimit: limit // Pass the custom limit
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
            console.error("Yoco Initialization Error", e)
            alert("Payment system error: " + e.message)
        }
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

                    {/* Free Plan */}
                    <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Basic</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                            R0 <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ forever</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', color: 'var(--color-text-muted)', lineHeight: '1.8', fontSize: '0.95rem' }}>
                            <li>✅ 5 Searches Total</li>
                            <li>✅ Basic Scanning</li>
                            <li>✅ Community Reports</li>
                            <li>❌ Advanced Analysis</li>
                        </ul>
                        <button disabled className="btn btn-outline" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>Current Plan</button>
                    </div>

                    {/* Pro Plan */}
                    <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--color-primary)' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--color-primary-light)' }}>Pro</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                            R79 <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ month</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', lineHeight: '1.8', fontSize: '0.95rem' }}>
                            <li>⚡ <strong>100 Searches / mo</strong></li>
                            <li>🛡️ <strong>Security Intel Access</strong></li>
                            <li>✅ Advanced Scanning</li>
                            <li>✅ Priority support</li>
                        </ul>
                        <button
                            onClick={() => sdkError ? loadYoco() : handleUpgrade('pro')}
                            disabled={loading || (!sdkReady && !sdkError)}
                            className={sdkError ? "btn btn-danger" : "btn btn-outline"}
                            style={{ width: '100%', opacity: (!sdkReady && !sdkError) ? 0.7 : 1 }}
                        >
                            {sdkError ? 'Retry Connection' : (!sdkReady ? 'Loading...' : 'Get Pro')}
                        </button>
                        {sdkError && <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.5rem', textAlign: 'center' }}>Payment system blocked. Please disable adblockers.</div>}
                    </div>

                    {/* Elite Plan */}
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        border: '2px solid var(--color-primary)',
                        background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--color-primary)', color: 'white', padding: '0.25rem 1rem',
                            borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>BEST VALUE</div>

                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'white' }}>Elite</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            R119 <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ month</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#86efac', marginBottom: '2rem' }}>Massive Capability</div>

                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', lineHeight: '1.8', fontSize: '0.95rem' }}>
                            <li>🚀 <strong>1,000 Searches / mo</strong></li>
                            <li>🌍 <strong>Full Global Intel</strong></li>
                            <li>⚡ <strong>Fastest Execution</strong></li>
                        </ul>
                        <button
                            onClick={() => sdkError ? loadYoco() : handleUpgrade('elite')}
                            disabled={loading || (!sdkReady && !sdkError)}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', opacity: (!sdkReady && !sdkError) ? 0.7 : 1 }}
                        >
                            {sdkError ? 'Retry Connection' : (!sdkReady ? 'Loading...' : 'Get Elite')}
                        </button>
                        {sdkError && <div style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.5rem', textAlign: 'center' }}>Payment system blocked. Please disable adblockers.</div>}
                    </div>

                    {/* Custom Plan (Slider) */}
                    <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', gridColumn: '1 / -1', maxWidth: '100%' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Custom Enterprise</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                R{customPrice} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ month</span>
                            </div>
                            <div style={{ paddingBottom: '0.5rem', color: 'var(--color-success)', fontWeight: 'bold' }}>
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

                        <ul style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            listStyle: 'none',
                            padding: 0,
                            marginBottom: '2rem',
                            color: 'var(--color-text-muted)',
                            lineHeight: '1.8',
                            fontSize: '0.95rem'
                        }}>
                            <li>✅ <strong>Volume-based Discount</strong></li>
                            <li>✅ <strong>Dedicated API Keys</strong></li>
                            <li>✅ <strong>Priority 24/7 Support</strong></li>
                            <li>✅ <strong>Custom Integration</strong></li>
                        </ul>
                        <button
                            onClick={() => sdkError ? loadYoco() : handleUpgrade('custom')}
                            disabled={loading || (!sdkReady && !sdkError)}
                            className="btn btn-outline"
                            style={{ width: '100%', maxWidth: '300px', opacity: (!sdkReady && !sdkError) ? 0.7 : 1 }}
                        >
                            {sdkError ? 'Retry Connection' : (!sdkReady ? 'Loading...' : 'Upgrade to Enterprise')}
                        </button>
                    </div>

                </div>
            </div>
        </main>
    )
}
