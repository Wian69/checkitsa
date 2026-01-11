"use client"
import Navbar from '@/components/Navbar'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Signup() {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        // Global handler for Google Sign In
        window.handleGoogleCredentialResponse = async (response) => {
            setLoading(true)
            try {
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: response.credential })
                })

                if (!res.ok) throw new Error('Google authentication failed')

                const data = await res.json()
                localStorage.setItem('checkitsa_user', JSON.stringify(data.user))
                localStorage.setItem('checkitsa_tier', data.user.tier || 'free')
                router.push('/')
            } catch (err) {
                setError(err.message)
                setLoading(false)
            }
        }
    }, [router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify(formData)
            })

            let data
            const contentType = res.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                data = await res.json()
            } else {
                const text = await res.text()
                console.error('Non-JSON response:', text)
                throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}...`)
            }

            if (!res.ok) throw new Error(data.message)

            localStorage.setItem('checkitsa_user', JSON.stringify(data.user))
            localStorage.setItem('checkitsa_tier', 'free')
            router.push('/')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '10rem', paddingBottom: '4rem' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '3rem' }}>
                    <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>Create Account</h2>
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        Register to continue using CheckItSA
                    </p>

                    {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                    {/* Google Sign In */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div id="g_id_onload"
                            data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "729035479590-9dffbod3sfn21cq1q0gshqjm4358nnrq.apps.googleusercontent.com"}
                            data-context="signup"
                            data-ux_mode="popup"
                            data-callback="handleGoogleCredentialResponse"
                            data-auto_prompt="false">
                        </div>
                        <div className="g_id_signin"
                            data-type="standard"
                            data-shape="rectangular"
                            data-theme="filled_black"
                            data-text="signup_with"
                            data-size="large"
                            data-logo_alignment="left"
                            data-width="100%">
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                        <span style={{ fontSize: '0.875rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'white' }}
                            />
                        </div>

                        <button disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            Already have an account? <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign In</Link>
                        </div>
                    </form>
                </div>
            </div>
            <script src="https://accounts.google.com/gsi/client" async defer></script>
        </main>
    )
}
