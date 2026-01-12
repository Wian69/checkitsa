import Navbar from '@/components/Navbar'

export default function TrustPage() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️ Trust & Security Transparency</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                    CheckItSA is a non-profit security initiative designed to protect South Africans from digital fraud.
                </p>

                <div className="glass-panel" style={{ padding: '2rem', display: 'grid', gap: '2rem' }}>
                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Our Mission</h2>
                        <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                            We provide ethical verification tools and community-driven scam reporting. Our goal is to reduce the success rate of phishing, banking fraud, and deceptive marketplaces in South Africa.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Safety for Scanners & Bots</h2>
                        <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                            CheckItSA frequently references keywords and links related to online fraud (e.g., "phishing", "scam"). These are for educational and verification purposes only.
                        </p>
                        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', listStyle: 'disc' }}>
                            <li>All outbound links to reported sites are "No-Followed".</li>
                            <li>We do not host or distribute malware.</li>
                            <li>We do not collect sensitive user data (passwords, bank details).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Data Sources</h2>
                        <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                            Our verification tools use publically indexed data from official registries like CIPC and BizPortal, powered by the Google Search API and Google Gemini AI for summarization.
                        </p>
                    </section>

                    <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            If you represent a security organization or blacklist and believe we have been falsely flagged, please contact our administrative team at info@checkitsa.co.za.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    )
}
