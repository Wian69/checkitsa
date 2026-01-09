import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function Dashboard() {
    const tools = [
        { title: 'Scam Detector', href: '/verify/scam', icon: '🕵️', desc: 'Check emails & links' },
        { title: 'Gambling Check', href: '/verify/gambling', icon: '🎰', desc: 'Verify site license' },
        { title: 'ID Verification', href: '/verify/id', icon: '🆔', desc: 'Validate SA ID' },
        { title: 'Business Verify', href: '/verify/business', icon: '🏢', desc: 'CIPC Check' },
        { title: 'Traffic Fines', href: '/verify/fines', icon: '🚗', desc: 'Check outstanding fines' },
        { title: 'Phone Lookup', href: '/verify/phone', icon: '📱', desc: 'Caller Identity' }
    ]

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Welcome back, User</p>
                    </div>
                    <button className="btn btn-primary">+ New Scan</button>
                </div>

                {/* Quick Tools */}
                <h3 style={{ marginBottom: '1.5rem' }}>Verification Tools</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    {tools.map((tool) => (
                        <Link href={tool.href} key={tool.title} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '2rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.75rem' }}>{tool.icon}</div>
                            <div>
                                <h4 style={{ marginBottom: '0.25rem' }}>{tool.title}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{tool.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Recent Activity Mock */}
                <h3 style={{ marginBottom: '1.5rem' }}>Recent Activity</h3>
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Type</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Target</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Status</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { type: 'ID Check', target: '9202...089', status: 'Verified', color: 'var(--color-success)' },
                                { type: 'Scam Scan', target: 'suspicious-link.com', status: 'High Risk', color: 'var(--color-danger)' },
                                { type: 'Gambling', target: 'lottostar.co.za', status: 'Safe', color: 'var(--color-success)' },
                            ].map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>{row.type}</td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{row.target}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', background: `${row.color}20`, color: row.color, fontSize: '0.875rem', fontWeight: 600 }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Today</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}
