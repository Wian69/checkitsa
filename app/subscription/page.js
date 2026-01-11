"use client"
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Subscription() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Load User
        const u = localStorage.getItem('checkitsa_user')
        if (u) {
            setUser(JSON.parse(u))
        } else {
            router.push('/login')
        }

        // Load Yoco SDK
        const script = document.createElement('script')
        script.src = "https://js.yoco.com/sdk/v1/yoco-sdk-web.js"
        script.async = true
        document.body.appendChild(script)

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const handleUpgrade = (plan) => {
        if (!window.YocoSDK) {
            alert("Payment system loading... please try again in a moment.")
            return
        }

        // Pricing Logic
        let amount = 0
        let desc = ''

        if (plan === 'pro') {
            amount = 7900 // R79.00
            desc = 'Pro Subscription (100 Scans)'
        } else if (plan === 'elite') {
            amount = 11900 // R119.00
            desc = 'Elite Subscription (1k Scans)'
        }

        const yoco = new window.YocoSDK({
            publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY
        })

        yoco.showPopup({
            amountInCents: amount,
            currency: 'ZAR',
            name: 'CheckItSA Premium',
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
                                amount: amount
                            })
                        })

                        const data = await res.json()
                        if (!res.ok) throw new Error(data.message)

                        localStorage.setItem('checkitsa_user', JSON.stringify(data.user))
                        localStorage.setItem('checkitsa_tier', data.user.tier) // Expecting 'pro' or 'elite'

                        alert(`Upgrade Successful! You are now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`)
                        router.push('/dashboard')
                    } catch (err) {
                        alert("Verification Failed: " + err.message)
                    } finally {
                        setLoading(false)
                    }
                }
            }
        })
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
                            <li>✅ Basic Web Scanning</li>
                            <li>✅ Community Reports</li>
                            <li style={{ opacity: 0.5 }}>❌ Image Analysis</li>
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
                        <button onClick={() => handleUpgrade('pro')} disabled={loading} className="btn btn-outline" style={{ width: '100%' }}>Get Pro</button>
                    </div>

                    {/* Elite Plan */}
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        border: '2px solid var(--color-primary)',
                        background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                        transform: 'scale(1.05)',
                        position: 'relative',
                        zIndex: 2
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
                            <li>🔍 <strong>Deep Image Analysis</strong></li>
                            <li>⚡ <strong>Fastest Execution</strong></li>
                        </ul>
                        <button onClick={() => handleUpgrade('elite')} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Get Elite</button>
                    </div>

                    {/* Custom Plan */}
                    <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Custom</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                            R50+
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', color: 'var(--color-text-muted)', lineHeight: '1.8', fontSize: '0.95rem' }}>
                            <li>✅ Volume-based Pricing</li>
                            <li>✅ Base Fee + Usage</li>
                            <li>✅ Tailored Limits</li>
                            <li>✅ API Integration</li>
                        </ul>
                        <a href="mailto:sales@checkitsa.co.za" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', width: '100%' }}>Contact Sales</a>
                    </div>

                </div>
            </div>
        </main>
    )
}
