
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsOfService() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', paddingBottom: '6rem', maxWidth: '900px' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Terms of Service</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                    By using CheckItSA, you agree to the following terms and conditions.
                </p>

                <div className="glass-panel" style={{ padding: '3rem', fontSize: '1.1rem', lineHeight: 1.8, color: '#d1d5db' }}>
                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
                        <p>
                            CheckItSA provides verification and scam reporting tools. By accessing our services, you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Use of Services</h2>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                            <li>You must provide accurate information when creating an account or reporting an incident.</li>
                            <li>Our verification tools are provided for informational purposes only. While we strive for accuracy, CheckItSA does not guarantee that search results are 100% conclusive.</li>
                            <li>You may not use our services to harass, defame, or track individuals without their consent.</li>
                            <li>Abuse of our search system or attempting to bypass limits may result in account termination.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>3. Limitation of Liability</h2>
                        <p>
                            CheckItSA shall not be held liable for any financial losses, damages, or decisions made based on the results of our verification tools. Users are encouraged to perform their own due diligence before engaging in financial transactions.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>4. Community Reporting</h2>
                        <p>
                            Information submitted through our "Report Incident" feature may be made public if verified by our moderation team. By submitting a report, you grant CheckItSA a license to display and use the information to warn others.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>5. Modifications</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Significant changes will be announced on the dashboard or via email.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>6. Governing Law</h2>
                        <p>
                            These terms are governed by the laws of the Republic of South Africa.
                        </p>
                    </section>
                </div>
            </div>

            <Footer />
        </main>
    )
}
