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

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    useEffect(() => {
        if (listings.length <= 1 || isPaused) return
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % listings.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [listings.length, isPaused])

    const nextSlide = () => setCurrentIndex(prev => (prev + 1) % listings.length)
    const prevSlide = () => setCurrentIndex(prev => (prev - 1 + listings.length) % listings.length)

    const handleTrackClick = async (id) => {
        try {
            await fetch('/api/advertise/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
        } catch (err) {
            console.error('Click tracking failed:', err)
        }
    }

    if (loading) return null
    if (listings.length === 0) return null

    return (
        <section className="container content-section"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem' }}>Verified Business Partners {isPaused && <span style={{ fontSize: '0.8rem', verticalAlign: 'middle', opacity: 0.5 }}>⏸ Paused</span>}</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Trustworthy services vetted by the CheckItSA community. {listings.length > 1 && `(${currentIndex + 1}/${listings.length})`}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={prevSlide} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', width: '2.5rem', height: '2.5rem' }}>←</button>
                    <button onClick={nextSlide} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', width: '2.5rem', height: '2.5rem' }}>→</button>
                    <a href="/advertise" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem', marginLeft: '1rem' }}>Promote Your Business →</a>
                </div>
            </div>

            <div style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)'
            }}>
                <div style={{
                    display: 'flex',
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: `translateX(-${currentIndex * 100}%)`,
                }}>
                    {listings.map((item) => (
                        <div key={item.id} style={{ flex: '0 0 100%', padding: '0 0.5rem' }}>
                            <div className="glass-panel" style={{
                                padding: '3rem',
                                color: 'inherit',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '3rem',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
                                position: 'relative',
                                minHeight: '300px',
                                transition: 'all 0.3s ease'
                            }}>
                                {/* Verified Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    textTransform: 'uppercase'
                                }}>
                                    ✓ Verified Partner
                                </div>

                                <div style={{ flex: '2', minWidth: '300px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div style={{
                                            width: '4.5rem',
                                            height: '4.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2rem',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>{item.business_name.charAt(0)}</div>
                                        <div>
                                            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>{item.business_name}</h3>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.category}</span>
                                                {item.registration_number && (
                                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                                                        CIPC: {item.registration_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>{item.description}</p>

                                    <a
                                        href={item.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        onClick={() => handleTrackClick(item.id)}
                                        style={{ padding: '1rem 2.5rem', background: '#10b981', fontWeight: 'bold' }}
                                    >
                                        Visit Official Website →
                                    </a>
                                </div>

                                {item.images && (
                                    <div style={{ flex: '1.5', minWidth: '300px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        {JSON.parse(item.images).slice(0, 4).map((img, idx) => (
                                            <div key={idx} style={{
                                                aspectRatio: '4/3',
                                                borderRadius: '1rem',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                boxShadow: 'var(--shadow-lg)'
                                            }}>
                                                <img src={img} alt="Showcase" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '0',
                                    width: '100%',
                                    height: '4px',
                                    background: 'linear-gradient(90deg, #10b981 0%, transparent 100%)',
                                    opacity: 0.5
                                }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
