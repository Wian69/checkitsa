"use client"
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import saBusinesses from '@/app/lib/saBusinesses.json'

export default function SubmitReviewPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [selectedBusiness, setSelectedBusiness] = useState(null)
    const [isUnlisted, setIsUnlisted] = useState(false)
    const [customBusinessName, setCustomBusinessName] = useState('')
    const [customDomain, setCustomDomain] = useState('')

    const [type, setType] = useState('review') // 'review' or 'complaint'
    const [rating, setRating] = useState(5)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    
    const [reviewerName, setReviewerName] = useState('')
    const [reviewerEmail, setReviewerEmail] = useState('')
    
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)
    const [communityBusinesses, setCommunityBusinesses] = useState([])

    // Fetch community businesses from DB on mount
    useEffect(() => {
        fetch('/api/reviews?distinct=true')
            .then(res => res.json())
            .then(data => {
                if (data.businesses) {
                    const mapped = data.businesses.map(b => ({
                        name: b.name,
                        supportEmail: b.email,
                        complaintEmail: b.email,
                        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random`,
                        isCommunity: true
                    }))
                    setCommunityBusinesses(mapped)
                }
            })
            .catch(console.error)
    }, [])

    // Handle Search Autocomplete
    useEffect(() => {
        if (!selectedBusiness && searchQuery.length > 1 && !isUnlisted) {
            const combinedList = [...saBusinesses, ...communityBusinesses]
            const uniqueMap = new Map()
            combinedList.forEach(b => {
                if (!uniqueMap.has(b.name.toLowerCase())) {
                    uniqueMap.set(b.name.toLowerCase(), b)
                }
            })
            const allUnique = Array.from(uniqueMap.values())
            const matches = allUnique.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
            setSuggestions(matches.slice(0, 10)) // limit suggestions to prevent massive lists
        } else {
            setSuggestions([])
        }
    }, [searchQuery, selectedBusiness, isUnlisted, communityBusinesses])

    const handleSelectBusiness = (b) => {
        setSelectedBusiness(b)
        setSearchQuery(b.name)
        setSuggestions([])
        setIsUnlisted(false)
    }

    const handleSelectUnlisted = () => {
        setSelectedBusiness(null)
        setSuggestions([])
        setIsUnlisted(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        let finalBusinessName = selectedBusiness ? selectedBusiness.name : (customBusinessName || searchQuery)
        let finalBusinessEmail = ''

        if (selectedBusiness) {
            finalBusinessEmail = type === 'complaint' ? selectedBusiness.complaintEmail : selectedBusiness.supportEmail
        } else if (customDomain) {
            const cleanDomain = customDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
            finalBusinessEmail = type === 'complaint' ? `complaints@${cleanDomain}` : `info@${cleanDomain}`
        }

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: finalBusinessName,
                    businessEmail: finalBusinessEmail,
                    rating,
                    title,
                    content,
                    reviewerName,
                    reviewerEmail,
                    type // 'review' or 'complaint'
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Submission failed')

            setSuccess(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Navbar />
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px', margin: '10rem auto 0' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Submitted Successfully</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Your {type} has been submitted. The business has been officially notified.
                    </p>
                    <Link href="/reviews" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                        View Public Reviews
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem', maxWidth: '800px' }}>
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
                        Submit a <span className="gradient-text">Review or Complaint</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
                        Your feedback will be published publicly and sent directly to the business.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '3rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* TYPE TOGGLE */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>What kind of feedback is this?</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setType('review')}
                                    style={{
                                        flex: 1, padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
                                        background: type === 'review' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: `2px solid ${type === 'review' ? 'var(--color-primary)' : 'transparent'}`,
                                        color: type === 'review' ? 'white' : 'var(--color-text-muted)'
                                    }}
                                >
                                    ⭐ Standard Review
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('complaint')}
                                    style={{
                                        flex: 1, padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
                                        background: type === 'complaint' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: `2px solid ${type === 'complaint' ? '#ef4444' : 'transparent'}`,
                                        color: type === 'complaint' ? 'white' : 'var(--color-text-muted)'
                                    }}
                                >
                                    🚨 Severe Complaint
                                </button>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

                        {/* BUSINESS SEARCH */}
                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Search for the Business</label>
                            {!isUnlisted ? (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Type a business name (e.g. Takealot, Vodacom)..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            setSelectedBusiness(null)
                                        }}
                                        required={!isUnlisted}
                                        className="input-field"
                                        style={{ width: '100%' }}
                                    />
                                    {suggestions.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', marginTop: '0.5rem', zIndex: 10, overflow: 'hidden'
                                        }}>
                                            {suggestions.map(b => (
                                                <div key={b.name} onClick={() => handleSelectBusiness(b)} style={{
                                                    padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                }} className="hover-bg">
                                                    <img src={b.logo} alt={b.name} style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'white' }} />
                                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong>{b.name}</strong>
                                                        {b.isCommunity && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>Community Directory</span>}
                                                    </div>
                                                </div>
                                            ))}
                                            <div onClick={handleSelectUnlisted} style={{ padding: '1rem', cursor: 'pointer', color: 'var(--color-primary)', textAlign: 'center' }} className="hover-bg">
                                                + Cannot find business? Enter manually.
                                            </div>
                                        </div>
                                    )}
                                    {selectedBusiness && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid #22c55e', borderRadius: '0.5rem', color: '#86efac', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span><strong>{selectedBusiness.name}</strong> selected. We will automatically route this to their {type === 'complaint' ? 'Complaints' : 'Support'} department.</span>
                                            <button type="button" onClick={() => { setSelectedBusiness(null); setSearchQuery('') }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px dashed rgba(255,255,255,0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: 'var(--color-primary)' }}>Manual Business Entry</strong>
                                        <button type="button" onClick={() => setIsUnlisted(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>Back to Search</button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Exact Business Name"
                                        value={customBusinessName}
                                        onChange={(e) => setCustomBusinessName(e.target.value)}
                                        required={isUnlisted}
                                        className="input-field"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Business Website Domain (e.g. momentum.co.za) - Required to send email"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        required={isUnlisted}
                                        className="input-field"
                                    />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>We will use the domain to try and construct their {type === 'complaint' ? 'complaints@' : 'info@'} email.</span>
                                </div>
                            )}
                        </div>

                        {/* RATING */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Rating</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setRating(num)}
                                        style={{
                                            background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer',
                                            color: num <= rating ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                                            transition: 'transform 0.2s'
                                        }}
                                        className="hover-scale"
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Title of your {type}</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Summarize your experience..."
                                className="input-field"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Detailed Description</label>
                            <textarea
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={`Please explain exactly what happened...`}
                                className="input-field"
                                style={{ width: '100%', minHeight: '150px', resize: 'vertical' }}
                            ></textarea>
                        </div>

                        {/* USER DETAILS */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Your Name (Optional)</label>
                                <input
                                    type="text"
                                    value={reviewerName}
                                    onChange={(e) => setReviewerName(e.target.value)}
                                    placeholder="Jane Doe (Leave blank for Anonymous)"
                                    className="input-field"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Your Email (Required to notify business)</label>
                                <input
                                    type="email"
                                    required
                                    value={reviewerEmail}
                                    onChange={(e) => setReviewerEmail(e.target.value)}
                                    placeholder="jane@example.com"
                                    className="input-field"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {error && <div style={{ color: '#ef4444', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>{error}</div>}

                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '1.2rem', fontSize: '1.2rem', marginTop: '1rem' }}>
                            {loading ? 'Submitting & Routing...' : `Submit Public ${type === 'complaint' ? 'Complaint' : 'Review'}`}
                        </button>
                    </form>
                </div>
            </div>
            
            <style jsx>{`
                .hover-bg:hover { background: rgba(255,255,255,0.05); }
                .hover-scale:hover { transform: scale(1.2); }
            `}</style>
        </main>
    )
}
