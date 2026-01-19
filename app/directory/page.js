"use client"

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function DirectoryPage() {
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSearch, setActiveSearch] = useState('') // The search term actually applied

    const categories = ['All', 'Security', 'Finance', 'Legal', 'Retail', 'Real Estate', 'Automotive', 'Healthcare', 'Technology', 'Construction', 'Travel', 'Hospitality', 'Other']

    useEffect(() => {
        fetch('/api/advertise/list') // Reuse existing list API
            .then(res => res.json())
            .then(data => {
                setListings(data.listings || [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const filteredListings = listings.filter(l => {
        // Category Filter
        const catMatch = selectedCategory === 'All' || l.category === selectedCategory

        // Search Filter
        const searchMatch = !activeSearch
            ? true
            : (l.business_name?.toLowerCase().includes(activeSearch.toLowerCase()) ||
                l.description?.toLowerCase().includes(activeSearch.toLowerCase()))

        return catMatch && searchMatch
    })

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        marginBottom: '1rem',
                        background: 'linear-gradient(to bottom, #fff 0%, #a5b4fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Verified Business Directory
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}>
                        Browse South Africa's most trusted businesses. All listings are verified for your safety.
                    </p>

                    {/* Search Bar */}
                    <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Search businesses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(searchQuery)}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'white'
                            }}
                        />
                        <button
                            onClick={() => setActiveSearch(searchQuery)}
                            className="btn btn-primary"
                        >
                            Search
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '250px 1fr', gap: '2rem' }} className="directory-layout">
                    {/* Sidebar / Top Bar Filters */}
                    <aside style={{ marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '6rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Categories</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'left',
                                            background: selectedCategory === cat ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                            border: selectedCategory === cat ? '1px solid var(--color-primary)' : '1px solid transparent',
                                            borderRadius: '0.5rem',
                                            color: selectedCategory === cat ? 'white' : 'var(--color-text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: selectedCategory === cat ? 'bold' : 'normal'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Listings Grid */}
                    <div style={{ flex: 1 }}>
                        <style jsx>{`
                            @media (min-width: 1024px) {
                                .directory-layout {
                                    grid-template-columns: 250px 1fr !important;
                                }
                            }
                        `}</style>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                Loading directory...
                            </div>
                        ) : filteredListings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📢</div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>No businesses found here yet.</h3>
                                <p style={{ marginBottom: '2rem' }}>Be the first verified business in this category!</p>
                                <Link href="/advertise" className="btn btn-primary" style={{ display: 'inline-block' }}>
                                    List Your Business for R99
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {filteredListings.map(l => (
                                    <div key={l.id} className="glass-panel hover-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        {/* Image Preview */}
                                        <div style={{ height: '200px', background: '#000', position: 'relative' }}>
                                            {l.images ? (
                                                <img
                                                    src={JSON.parse(l.images)[0]}
                                                    alt={l.business_name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '3rem' }}>
                                                    🏢
                                                </div>
                                            )}
                                            <div style={{
                                                position: 'absolute', top: '10px', right: '10px',
                                                background: 'rgba(16, 185, 129, 0.9)', color: 'white',
                                                padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                                fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem'
                                            }}>
                                                ✓ Verified
                                            </div>
                                        </div>

                                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                                {l.category}
                                            </div>
                                            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'white' }}>{l.business_name}</h3>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {l.description}
                                            </p>

                                            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                                                <a href={l.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>
                                                    Visit Website
                                                </a>
                                                <Link href={`/business/${l.id}`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>
                                                    View Profile
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
