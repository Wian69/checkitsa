"use client"

import { useState, useEffect } from 'react'

export default function FeaturedListings() {
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchListings() {
            try {
                const res = await fetch('/api/advertise/list')
                if (res.ok) {
                    const data = await res.json()
                    setListings(data.listings || [])
                }
            } catch (err) {
                console.error('Failed to fetch listings:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchListings()
    }, [])

    if (loading) return null
    if (listings.length === 0) return null

    return (
        <section className="container content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem' }}>Verified Business Partners</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Trustworthy services vetted by the CheckItSA community.</p>
                </div>
                <a href="/advertise" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Promote Your Business →</a>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {listings.map((item) => (
                    <div key={item.id} className="glass-panel hover-card" style={{
                        padding: '2rem',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Verified Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            padding: '0.3rem 0.7rem',
                            borderRadius: '2rem',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            textTransform: 'uppercase'
                        }}>
                            ✓ Verified
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '3.5rem',
                                height: '3.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.4rem',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>{item.business_name.charAt(0)}</div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.1rem' }}>{item.business_name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>{item.category}</span>
                                    {item.registration_number && (
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                            Reg: {item.registration_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1 }}>{item.description}</p>

                        {item.images && (
                            <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
                                {JSON.parse(item.images).slice(0, 3).map((img, idx) => (
                                    <div key={idx} style={{ width: '60px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <img src={img} alt="Business" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                                {JSON.parse(item.images).length > 3 && (
                                    <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        +{JSON.parse(item.images).length - 3}
                                    </div>
                                )}
                            </div>
                        )}

                        <a href={item.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }} className="hover:underline">Visit Website →</a>

                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            height: '2px',
                            background: 'linear-gradient(90deg, #10b981 0%, transparent 100%)',
                            opacity: 0.3
                        }}></div>
                    </div>
                ))}
            </div>
        </section>
    )
}
