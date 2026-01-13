"use client"
import Navbar from '@/components/Navbar'
import AdBanner from '@/components/AdBanner'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GamblingCheck() {
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    useEffect(() => {
        const user = localStorage.getItem('checkitsa_user')
        if (!user) {
            alert('Please create a free account or login to access our verification tools.')
            router.push('/signup')
        }
    }, [])

    // Static List - Now with Affiliate Capability & Official License Numbers
    const legalSites = [
        { domain: 'lottostar.co.za', name: 'LottoStar', license: 'Mpumalanga Economic Regulator', licenseNumber: '9-2-1-09467', affiliateUrl: 'https://lottostar.co.za/?ref=checkitsa' },
        { domain: 'betway.co.za', name: 'Betway', license: 'Western Cape Gambling Board', licenseNumber: '10181496-012', affiliateUrl: 'https://betway.co.za/?ref=checkitsa' },
        { domain: 'hollywoodbets.net', name: 'Hollywoodbets', license: 'Western Cape Gambling Board', licenseNumber: '10110547-015', affiliateUrl: 'https://hollywoodbetsaffs.click/o/hP6iNE?lpage=wkMWJB&site_id=100761' },
        { domain: 'supabets.co.za', name: 'Supabets', license: 'Mpumalanga Gambling Board', licenseNumber: '9-2-1-00055', affiliateUrl: 'https://supabets.co.za/?ref=checkitsa' },
        { domain: 'sunbet.co.za', name: 'SunBet', license: 'Western Cape Gambling Board', licenseNumber: '10138713-016', affiliateUrl: 'https://sunbet.co.za/?ref=checkitsa' },
        { domain: 'bet.co.za', name: 'Bet.co.za', license: 'Western Cape Gambling Board', licenseNumber: '10145732-016', affiliateUrl: 'https://bet.co.za/?ref=checkitsa' },
        { domain: 'sportingbet.co.za', name: 'Sportingbet', license: 'Western Cape Gambling Board', licenseNumber: '10125193-018', affiliateUrl: 'https://sportingbet.co.za/?ref=checkitsa' },
        { domain: 'gbets.co.za', name: 'Gbets', license: 'Western Cape Gambling Board', licenseNumber: '10179096-012', affiliateUrl: 'https://gbets.co.za/?ref=checkitsa' },
        { domain: '10bet.co.za', name: '10Bet', license: 'Mpumalanga Economic Regulator', licenseNumber: '9-2-1-09661', affiliateUrl: 'https://10bet.co.za/?ref=checkitsa' },
        { domain: 'palacebet.co.za', name: 'PalaceBet', license: 'Western Cape Gambling Board', licenseNumber: '10189453-001', affiliateUrl: 'https://palacebet.co.za/?ref=checkitsa' },
        { domain: 'tic-tac.co.za', name: 'Tic Tac Bets', license: 'Northern Cape Gambling Board', licenseNumber: 'NCGLB-BM.2025/01', affiliateUrl: 'https://tic-tac.co.za/?ref=checkitsa' },
        { domain: 'playabets.co.za', name: 'Playa Bets', license: 'KZN Gambling & Betting Board', licenseNumber: '10141335-012', affiliateUrl: 'https://playabets.co.za/?ref=checkitsa' },
        { domain: 'wsb.co.za', name: 'World Sports Betting', license: 'Western Cape Gambling Board', licenseNumber: '10181495-013', affiliateUrl: 'https://wsb.co.za/?ref=checkitsa' },
        { domain: 'yesplay.bet', name: 'YesPlay', license: 'Western Cape Gambling Board', licenseNumber: '10180204-012', affiliateUrl: 'https://yesplay.bet/?ref=checkitsa' },
        { domain: 'betfred.co.za', name: 'Betfred', license: 'Mpumalanga Economic Regulator', licenseNumber: '9-2-1-00039', affiliateUrl: 'https://betfred.co.za/?ref=checkitsa' },
        { domain: 'interbet.co.za', name: 'Interbet', license: 'Western Cape Gambling Board', licenseNumber: '10083472-023', affiliateUrl: 'https://interbet.co.za/?ref=checkitsa' },
        { domain: 'playtsogo.co.za', name: 'playTSOGO', license: 'Western Cape Gambling Board', licenseNumber: '10190075-04', affiliateUrl: 'https://playtsogo.co.za/?ref=checkitsa' }
    ]

    const filteredSites = legalSites.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.domain.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleVisit = (site) => {
        // Gambling checks are free and do not count towards limits
        const targetUrl = site.affiliateUrl || `https://${site.domain}`
        window.open(targetUrl, '_blank')
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem', maxWidth: '1000px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Licensed Gambling Directory</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Only bet on sites licensed by South African Provincial Gambling Boards.</p>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '200px', textAlign: 'right' }}>
                        To report illegal sites, use <a href="/report" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Report Incident</a>.
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>

                    {/* Official Partnership Badge */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ fontSize: '1.5rem' }}>🤝</div>
                        <div>
                            <p style={{ fontWeight: 'bold', color: 'white', marginBottom: '0.2rem' }}>Official Partnership</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                We are a proud affiliated member of <strong>Hollywoodbets</strong>. As South Africa's most trusted betting platform, they set the standard for safety and compliance.
                            </p>
                        </div>
                    </div>

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search licensed sites (e.g. Betway)..."
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-border)',
                            color: 'white',
                            fontSize: '1.1rem'
                        }}
                    />
                </div>

                {/* Top Ad */}
                <div className="container" style={{ marginBottom: '2rem' }}>
                    <AdBanner format="leaderboard" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filteredSites.map((site) => (
                        <div key={site.domain} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--color-success)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-success)', color: 'black', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderBottomLeftRadius: '0.5rem' }}>
                                LICENSED
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{site.name}</h3>
                            <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{site.domain}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <strong>Regulator:</strong> {site.license}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                                <strong>License No:</strong> {site.licenseNumber}
                            </div>
                            <button onClick={() => handleVisit(site)} className="btn btn-outline" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', fontSize: '0.875rem' }}>
                                Visit Safe Site ↗
                            </button>
                        </div>
                    ))}
                </div>

                {/* Bottom Ad */}
                <div className="container" style={{ marginTop: '3rem' }}>
                    <AdBanner format="rectangle" />
                </div>
            </div>
        </main>
    )
}
