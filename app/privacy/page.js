
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPolicy() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', paddingBottom: '6rem', maxWidth: '900px' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Privacy Policy</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                    Last Updated: January 11, 2026. This policy is designed to comply with the South African **Protection of Personal Information Act (POPIA)**.
                </p>

                <div className="glass-panel" style={{ padding: '3rem', fontSize: '1.1rem', lineHeight: 1.8, color: '#d1d5db' }}>
                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Introduction</h2>
                        <p>
                            CheckItSA ("we", "us", or "our") is committed to protecting the privacy of our users in South Africa.
                            This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our website
                            and verification tools.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Information We Collect</h2>
                        <p>We may collect the following types of information:</p>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                            <li><strong>Personal Identity:</strong> Your full name and email address provided during signup.</li>
                            <li><strong>Search History:</strong> Queries performed through our Website, Phone, and Business verification tools (synced to your account).</li>
                            <li><strong>Incident Reports:</strong> Information provided when reporting a scam, including names, phone numbers, and evidence of the scam.</li>
                            <li><strong>Technical Data:</strong> IP addresses and cookie identifiers for security and usage tracking.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>3. Purpose of Collection</h2>
                        <p>In accordance with POPIA, we collect information for the following specific purposes:</p>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                            <li>To provide fraud detection and verification services.</li>
                            <li>To synchronize your security history across your devices.</li>
                            <li>To investigate and moderate community-reported scams.</li>
                            <li>To prevent abuse of our search limits and API.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '3rem' }} id="cookies">
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>4. Cookie Policy</h2>
                        <p>
                            We use functional cookies to remember your login session and your search history.
                            These cookies are essential for the performance of the dashboard and cross-device sync.
                            You can choose to disable cookies in your browser settings, but some features of CheckItSA may stop working.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>5. Data Security</h2>
                        <p>
                            We implement industry-standard security measures, including HTTPS encryption and secure database protocols on Cloudflare,
                            to protect your data from unauthorized access or disclosure.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>6. Your Rights (POPIA)</h2>
                        <p>As a data subject in South Africa, you have the right to:</p>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                            <li>Request access to the personal information we hold about you.</li>
                            <li>Request the correction or deletion of your personal information.</li>
                            <li>Object to the processing of your personal information for marketing purposes.</li>
                            <li>Submit a complaint to the Information Regulator of South Africa.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>7. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy or wish to exercise your rights, please contact our Information Officer at:<br />
                            <strong>Email:</strong> info@checkitsa.co.za
                        </p>
                    </section>
                </div>
            </div>

            <Footer />
        </main>
    )
}
