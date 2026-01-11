"use client"
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function DeveloperDashboard() {
    const [user, setUser] = useState(null)
    const [apiKey, setApiKey] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (!u) {
            router.push('/login')
            return
        }
        const parsedUser = JSON.parse(u)
        setUser(parsedUser)
        fetchApiKey(parsedUser.email)
    }, [])

    const fetchApiKey = async (email) => {
        try {
            const res = await fetch('/api/developer/keys', {
                method: 'POST', // Using POST to fetch/refresh specific user data securely
                body: JSON.stringify({ email, action: 'fetch' })
            })
            const data = await res.json()
            if (data.apiKey) setApiKey(data.apiKey)
        } catch (e) {
            console.error("Failed to fetch key", e)
        }
    }

    const generateKey = async () => {
        if (!confirm("Generate a new API Key? Any old keys will stop working immediately.")) return
        setLoading(true)
        try {
            const res = await fetch('/api/developer/keys', {
                method: 'POST',
                body: JSON.stringify({ email: user.email, action: 'generate' })
            })
            const data = await res.json()
            if (data.apiKey) {
                setApiKey(data.apiKey)
                alert("New API Key Generated!")
            }
        } catch (e) {
            alert("Error: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    const isEligible = user.tier === 'elite' || user.tier === 'custom' || user.tier === 'ultimate' // 'ultimate' for legacy/admin

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '8rem', maxWidth: '1000px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Developer Portal</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Manage your API access and integration settings.</p>
                    </div>
                    {user.tier && (
                        <div className={`badge ${isEligible ? 'badge-success' : 'badge-warning'}`}>
                            {user.tier.toUpperCase()} PLAN
                        </div>
                    )}
                </div>

                {!isEligible ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--color-warning)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h2 style={{ marginBottom: '1rem' }}>API Access Locked</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                            Programmatic API access is reserved for <strong>Elite</strong> and <strong>Enterprise</strong> subscribers.
                            Upgrade your plan to start building with CheckItSA.
                        </p>
                        <button onClick={() => router.push('/subscription')} className="btn btn-primary">Upgrade Plan</button>
                    </div>
                ) : (
                    <>
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Your Secret API Key</h3>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    fontFamily: 'monospace',
                                    fontSize: '1.1rem',
                                    border: '1px solid var(--color-border)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {apiKey ? apiKey : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No active key found</span>}
                                </div>
                                <button
                                    onClick={() => apiKey && navigator.clipboard.writeText(apiKey)}
                                    className="btn btn-outline"
                                    disabled={!apiKey}
                                >
                                    Copy
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={generateKey} disabled={loading} className="btn btn-primary">
                                    {apiKey ? 'Rotate / Generate New Key' : 'Generate First Key'}
                                </button>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
                                <strong>Security Warning:</strong> This key grants full access to your search quota. Keep it secret.
                                Do not expose it in client-side code (browsers). Use it only from your secure backend servers.
                            </p>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Quick Integration Guide</h3>
                            <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Authenticated requests must include your key in the header:</p>

                            <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '0.5rem', overflowX: 'auto' }}>
                                <code style={{ color: '#d4d4d4', fontFamily: 'monospace' }}>
                                    <span style={{ color: '#569cd6' }}>curl</span> -X POST https://checkitsa.co.za/api/verifyscan \<br />
                                    &nbsp;&nbsp;-H <span style={{ color: '#ce9178' }}>"Authorization: Bearer {apiKey || 'sk_live_...'}"</span> \<br />
                                    &nbsp;&nbsp;-H <span style={{ color: '#ce9178' }}>"Content-Type: application/json"</span> \<br />
                                    &nbsp;&nbsp;-d <span style={{ color: '#ce9178' }}>'{`{"url": "example.com"}`}'</span>
                                </code>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
