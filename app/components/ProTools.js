"use client"
import { useState } from 'react'

export default function ProTools() {
    const [activeTool, setActiveTool] = useState(null) // 'deal', 'footprint', 'address'

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', border: '1px solid var(--color-primary-dark)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                <span>⚡</span> Premium Investigation Tools
            </h3>

            {/* Tool Selection Grid */}
            <div className="grid-responsive" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <button
                    onClick={() => setActiveTool('deal')}
                    className="btn"
                    style={{
                        background: activeTool === 'deal' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                        padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s',
                        color: activeTool === 'deal' ? 'white' : 'inherit'
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                    <div style={{ fontWeight: 'bold' }}>Deal Validator</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>Is that price real or a scam?</div>
                </button>

                <button
                    onClick={() => setActiveTool('footprint')}
                    className="btn"
                    style={{
                        background: activeTool === 'footprint' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                        padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s',
                        color: activeTool === 'footprint' ? 'white' : 'inherit'
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👣</div>
                    <div style={{ fontWeight: 'bold' }}>Digital Footprint</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>Scan social & pro networks</div>
                </button>

                <button
                    onClick={() => setActiveTool('address')}
                    className="btn"
                    style={{
                        background: activeTool === 'address' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                        padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s',
                        color: activeTool === 'address' ? 'white' : 'inherit'
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                    <div style={{ fontWeight: 'bold' }}>Address Auditor</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>Verify business locations</div>
                </button>
            </div>

            {/* Active Tool View */}
            <div style={{ marginTop: '2rem', minHeight: '300px' }}>
                {activeTool === 'deal' && <DealValidator />}
                {activeTool === 'footprint' && <DigitalFootprint />}
                {activeTool === 'address' && <AddressAuditor />}
                {!activeTool && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
                        Select a tool above to start a deep investigation.
                    </div>
                )}
            </div>
        </div>
    )
}

// 1. DEAL VALIDATOR COMPONENT
function DealValidator() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [form, setForm] = useState({ productName: '', offeredPrice: '' })

    const check = async (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/pro/deal-check', {
                method: 'POST', body: JSON.stringify(form)
            })
            const data = await res.json()
            setResult(data)
        } catch (e) { alert('Error checking deal') }
        setLoading(false)
    }

    return (
        <div className="tool-card fade-in">
            <h4 style={{ marginBottom: '1rem' }}>💰 Check Price Validity</h4>
            <form onSubmit={check} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr 100px' }}>
                <input placeholder="Product Name (e.g. iPhone 15)" className="input" required
                    value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '0.5rem', color: 'white' }}
                />
                <input placeholder="Offered Price (R)" type="number" className="input" required
                    value={form.offeredPrice} onChange={e => setForm({ ...form, offeredPrice: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '0.5rem', color: 'white' }}
                />
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '100%', borderRadius: '0.5rem' }}>
                    {loading ? '...' : 'Check'}
                </button>
            </form>

            {result && (
                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', borderTop: `4px solid ${result.status === 'SAFE' ? '#10b981' : (result.status === 'WARNING' ? '#f59e0b' : '#ef4444')}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: result.status === 'SAFE' ? '#10b981' : (result.status === 'WARNING' ? '#f59e0b' : '#ef4444') }}>
                            {result.riskLevel} Risk
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Market Avg: R {result.marketAverage?.toLocaleString()}</div>
                    </div>
                    <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{result.message}</p>

                    {result.sources && (
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Compared against:</div>
                            {result.sources.map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span>{s.title.substring(0, 30)}...</span>
                                    <span>{s.price}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// 2. DIGITAL FOOTPRINT COMPONENT
function DigitalFootprint() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [query, setQuery] = useState('')

    const scan = async (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/pro/digital-footprint', {
                method: 'POST', body: JSON.stringify({ query })
            })
            const data = await res.json()
            setResult(data)
        } catch (e) { alert('Error scanning footprint') }
        setLoading(false)
    }

    return (
        <div className="tool-card fade-in">
            <h4 style={{ marginBottom: '1rem' }}>👣 Scan Digital Presence</h4>
            <form onSubmit={scan} style={{ display: 'flex', gap: '1rem' }}>
                <input placeholder="Name, Email, Phone or Business Name" className="input" required
                    value={query} onChange={e => setQuery(e.target.value)}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '0.5rem', color: 'white' }}
                />
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 2rem', borderRadius: '0.5rem' }}>
                    {loading ? 'Scanning...' : 'Start Scan'}
                </button>
            </form>

            {result && (
                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: result.score > 50 ? '#10b981' : '#ef4444' }}>{result.score}/100</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Presence Score</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                {result.status === 'VERIFIED_PRESENCE' ? '✅ Confirmed Online Presence' : (result.status === 'GHOST' ? '👻 No Digital Footprint (Suspicious)' : '⚠️ High Risk Signals Found')}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                Found on: {result.platforms.join(', ') || 'Nowhere'}
                            </div>
                        </div>
                    </div>

                    {result.negativeSignals.length > 0 && (
                        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '0.5rem' }}>
                            <strong style={{ color: '#fca5a5' }}>⚠️ Risk Signals Detected:</strong>
                            <ul style={{ margin: '0.5rem 0 0 1rem', fontSize: '0.9rem', color: '#fca5a5' }}>
                                {result.negativeSignals.map((s, i) => (
                                    <li key={i}>{s.title}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// 3. ADDRESS AUDITOR COMPONENT
function AddressAuditor() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [form, setForm] = useState({ businessName: '', address: '' })

    const verify = async (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/pro/address-check', {
                method: 'POST', body: JSON.stringify(form)
            })
            const data = await res.json()
            setResult(data)
        } catch (e) { alert('Error checking address') }
        setLoading(false)
    }

    return (
        <div className="tool-card fade-in">
            <h4 style={{ marginBottom: '1rem' }}>📍 Verify Business Location</h4>
            <form onSubmit={verify} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr 100px' }}>
                <input placeholder="Business Name" className="input" required
                    value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '0.5rem', color: 'white' }}
                />
                <input placeholder="Claimed Address (e.g. 123 Main Rd)" className="input" required
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '0.5rem', color: 'white' }}
                />
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '100%', borderRadius: '0.5rem' }}>
                    {loading ? '...' : 'Verify'}
                </button>
            </form>

            {result && (
                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
                    {result.status === 'VERIFIED' ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Address Verified</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                "{result.name}" is a verified location on Google Maps at this address.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.9rem' }}>
                                <div>⭐ {result.rating || 'N/A'} Rating</div>
                                <div>📂 {result.category || 'Business'}</div>
                            </div>
                            <a href={result.mapsLink} target="_blank" className="btn btn-outline" style={{ marginTop: '1.5rem', display: 'inline-block' }}>View on Maps ↗</a>
                        </div>
                    ) : (result.status === 'WARNING_CLOSED' ? (
                        <div style={{ textAlign: 'center', color: '#fca5a5' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏚️</div>
                            <h3>Business appears CLOSED</h3>
                            <p>This location exists but is marked as Permanently or Temporarily Closed.</p>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#fca5a5' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
                            <h3>Location Not Verified</h3>
                            <p>{result.message || "We could not confirm this business exists at this address."}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
