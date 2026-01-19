"use client"

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export const runtime = 'edge';

export default function BusinessProfilePage() {
    const params = useParams()
    const [business, setBusiness] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!params.id) return

        fetch(`/api/business/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error)
                setBusiness(data.business)
                setProducts(data.products || [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError("Business not found")
                setLoading(false)
            })
    }, [params.id])

    if (loading) return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Loading Business Profile...</div>
        </main>
    )

    if (error || !business) return (
        <main style={{ minHeight: '100vh', paddingTop: '6rem', textAlign: 'center' }}>
            <Navbar />
            <h1 style={{ color: 'var(--color-danger)' }}>Business Not Found</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>The business listing you are looking for does not exist or has expired.</p>
            <Link href="/directory" className="btn btn-outline">Back to Directory</Link>
        </main>
    )

    const images = business.images ? JSON.parse(business.images) : []
    const coverImage = images[0] || null

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            {/* Hero Cover */}
            <div style={{ height: '300px', background: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                {coverImage && (
                    <img
                        src={coverImage}
                        alt={business.business_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                    />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100px', background: 'linear-gradient(to top, #0A0A0A, transparent)' }} />
            </div>

            <div className="container" style={{ marginTop: '-4rem', position: 'relative', zIndex: 10 }}>
                {/* Profile Header */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                ✓ CheckItSA Verified
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Reg: {business.registration_number || 'N/A'}
                            </span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{business.business_name}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '1.5rem', maxWidth: '600px' }}>
                            {business.description}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                🌐 Visit Website
                            </a>
                            <button onClick={() => window.open(`https://wa.me/?text=Hi, saw your verified listing on CheckItSA.`, '_blank')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                💬 WhatsApp
                            </button>
                            {/* <button onClick={() => alert("Verification Certificate download coming soon!")} className="btn btn-outline" style={{ borderColor: 'var(--color-border)' }}>
                                📜 View Certificate
                            </button> */}
                        </div>
                    </div>
                    {/* Trust Score Badge */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', minWidth: '150px'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>TRUST SCORE</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#a5b4fc', lineHeight: 1 }}>100/100</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Active & Verified</div>
                    </div>
                </div>

                {/* Product Catalog */}
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📦</span> Product & Service Catalog
                </h2>

                {products.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '1rem', color: 'var(--color-text-muted)' }}>
                        This business hasn't added any products yet.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {products.map(product => (
                            <div key={product.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '180px', background: '#222', position: 'relative' }}>
                                    {product.image_url && (
                                        <img
                                            src={product.image_url}
                                            alt={product.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        R{product.price?.toFixed(2)}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                        {product.category || 'Product'}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{product.title}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', flex: 1 }}>
                                        {product.description}
                                    </p>
                                    <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
                                        Enquire
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </main>
    )
}
