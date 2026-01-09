import Navbar from '@/components/Navbar'


export default function About() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem', textAlign: 'center' }}>About CheckItSA</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '5rem' }}>
                    Protecting South Africans from digital threats through automated intelligence.
                </p>

                <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Our Mission</h2>
                    <p style={{ lineHeight: 1.6, marginBottom: '2rem' }}>
                        CheckItSA was founded with a single goal: to provide ordinary South Africans with the same level of investigative tools used by cybersecurity professionals. In an era where scams are increasingly sophisticated, we believe that automated, instant verification is the only way to stay safe.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Automated Intelligence</h2>
                    <p style={{ lineHeight: 1.6, marginBottom: '2rem' }}>
                        Our platform leverages machine learning, real-time scraping, and API integrations with official databases to cross-reference information instantly. Whether it's a suspicious link, a fraudulent job offer, or an unverified company, CheckItSA does the background work for you.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Community Driven</h2>
                    <p style={{ lineHeight: 1.6 }}>
                        While our AI does much of the work, our community is our greatest strength. Every report submitted by a user helps train our models and warns thousands of others about new threats before they can do damage.
                    </p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Ready to stay protected?</h3>
                    <a href="/" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Start Verifying Now</a>
                </div>
            </div>
        </main>
    )
}
