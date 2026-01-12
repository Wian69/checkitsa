
import Link from 'next/link'

export default function Footer() {
    return (
        <footer style={{
            background: 'rgba(15, 23, 42, 0.5)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '4rem 0 2rem',
            marginTop: '4rem'
        }}>
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '3rem',
                    marginBottom: '3rem'
                }}>
                    {/* Brand */}
                    <div style={{ gridColumn: 'span 1' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--color-primary)' }}>CheckIt</span>SA
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            South Africa's most trusted verification platform. Combatting fraud and scams with real-time intelligence.
                        </p>
                    </div>

                    {/* Tools */}
                    <div>
                        <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1.25rem' }}>Solutions</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                            <li><Link href="/verify/scam" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Website Scanner</Link></li>
                            <li><Link href="/verify/business" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Business Verify</Link></li>
                            <li><Link href="/verify/phone" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Phone Lookup</Link></li>
                            <li><Link href="/report" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Report Scam</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1.25rem' }}>Company</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                            <li><Link href="/about" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">About Us</Link></li>
                            <li><Link href="/subscription" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Pricing</Link></li>
                            <li><Link href="/dashboard" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">User Dashboard</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1.25rem' }}>Legal (SA)</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                            <li><Link href="/privacy" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Privacy Policy (POPIA)</Link></li>
                            <li><Link href="/terms" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Terms of Service</Link></li>
                            <li><Link href="/privacy#cookies" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Cookie Policy</Link></li>
                            <li><Link href="/trust" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:text-white">Security Transparency</Link></li>
                        </ul>
                    </div>
                </div>

                <div style={{
                    paddingTop: '2rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        &copy; {new Date().getFullYear()} CheckItSA. Focused on South African Security.
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <span>POPIA Compliant</span>
                        <span>Secured by Cloudflare</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
