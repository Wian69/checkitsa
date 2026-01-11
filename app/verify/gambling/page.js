"use client"
import Navbar from '@/components/Navbar'


import { useState } from 'react'
import { trackSearch } from '@/utils/searchLimit'
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

    // Static List
    const legalSites = [
        { domain: 'lottostar.co.za', name: 'LottoStar', license: 'Mpumalanga Economic Regulator' },
        { domain: 'betway.co.za', name: 'Betway', license: 'Western Cape Gambling Board' },
        { domain: 'hollywoodbets.net', name: 'Hollywoodbets', license: 'Gauteng Gambling Board' },
        { domain: 'supabets.co.za', name: 'Supabets', license: 'Mpumalanga Economic Regulator' },
        { domain: 'sunbet.co.za', name: 'SunBet', license: 'Western Cape Gambling Board' },
        { domain: 'bet.co.za', name: 'BET.co.za', license: 'Western Cape Gambling Board' },
        { domain: 'sportingbet.co.za', name: 'Sportingbet', license: 'Western Cape Gambling Board' },
        { domain: 'gbets.co.za', name: 'Gbets', license: 'Western Cape Gambling Board' },
        { domain: '10bet.co.za', name: '10Bet', license: 'Mpumalanga Economic Regulator' },
        { domain: 'palacebet.co.za', name: 'PalaceBet', license: 'Western Cape Gambling Board' },
        { domain: 'tic-tac.co.za', name: 'Tic Tac Bets', license: 'Northern Cape Gambling Board' },
        { domain: 'playabets.co.za', name: 'Playa Bets', license: 'KZN Gaming & Betting Board' },
        { domain: 'wsb.co.za', name: 'World Sports Betting', license: 'Gauteng Gambling Board' },
        { domain: 'yesplay.bet', name: 'YesPlay', license: 'Western Cape Gambling Board' },
        { domain: 'betfred.co.za', name: 'Betfred', license: 'Mpumalanga Economic Regulator' }
    ]

    const filteredSites = legalSites.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.domain.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleVisit = (url) => {
        const { canSearch } = trackSearch()
        if (!canSearch) {
            alert("You've reached your limit of 5 free searches. Please upgrade to Pro for unlimited access.")
            router.push('/subscription')
            return
        }
        window.open(`https://${url}`, '_blank')
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filteredSites.map((site) => (
                        <div key={site.domain} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--color-success)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-success)', color: 'black', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderBottomLeftRadius: '0.5rem' }}>
                                LICENSED
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{site.name}</h3>
                            <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{site.domain}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <strong>License:</strong> {site.license}
                            </div>
                            <button onClick={() => handleVisit(site.domain)} className="btn btn-outline" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', fontSize: '0.875rem' }}>
                                Visit Safe Site ↗
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
