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

    const handleUpgrade = () => {
        if (!window.YocoSDK) {
            alert("Payment system loading... please try again in a moment.")
            return
        }

        const yoco = new window.YocoSDK({
            publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || 'pk_test_ed3c54a6gOol69QA7f45' // Fallback to Test Key if not set
        })

        yoco.showPopup({
            amountInCents: 9900, // R99.00
            currency: 'ZAR',
            name: 'CheckItSA Premium',
            description: 'Monthly Subscription',
            callback: async (result) => {
                if (result.error) {
                    alert("Payment Failed: " + result.error.message)
                } else {
                    setLoading(true)
                    try {
                        // Verify transaction on backend
                        const res = await fetch('/api/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                token: result.id,
                                email: user.email
                            })
                        })

                        const data = await res.json()
                        if (!res.ok) throw new Error(data.message)

                        // Update Local Storage
                        localStorage.setItem('checkitsa_user', JSON.stringify(data.user))
                        localStorage.setItem('checkitsa_tier', 'premium')

                        alert("Upgrade Successful! Welcome to Premium.")
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
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Upgrade Your Security</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Get unlimited access to South Africa's most advanced verification tools.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    maxWidth: '900px',
                    margin: '0 auto'
                }}>

                    {/* Free Plan */}
                    <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Free</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                            R0 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ forever</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', color: 'var(--color-text-muted)', lineHeight: '2' }}>
                            <li>✅ 5 Searches per lifetime</li>
                            <li>✅ Basic Web Scanning</li>
                            <li>✅ Community Reports</li>
                            <li style={{ opacity: 0.5 }}>❌ Image Analysis</li>
                            <li style={{ opacity: 0.5 }}>❌ Global Security Intel</li>
                        </ul>
                        <button disabled className="btn btn-outline" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                            Current Plan
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        border: '1px solid var(--color-primary)',
                        background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                        transform: 'scale(1.05)',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--color-primary)', color: 'white', padding: '0.25rem 1rem',
                            borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold'
                        }}>MOST POPULAR</div>

                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-primary-light)' }}>Premium</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                            R99 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ month</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', lineHeight: '2' }}>
                            <li>⚡ <strong>Unlimited Searches</strong></li>
                            <li>🛡️ <strong>Advanced Scanning (Deep Scan)</strong></li>
                            <li>🖼️ <strong>Image Analysis Tools</strong></li>
                            <li>🌍 <strong>Global Security Intel</strong></li>
                            <li>👔 <strong>Official Business Verification</strong></li>
                        </ul>
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {loading ? 'Processing...' : 'Upgrade Now'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            Secure payment via Yoco
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}
