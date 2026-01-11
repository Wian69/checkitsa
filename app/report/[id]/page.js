export const runtime = 'edge'

import Navbar from '@/components/Navbar'
import Link from 'next/link'

async function getReport(id) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/report?id=${id}`, {
            next: { revalidate: 0 }, // Always fresh for details
            headers: { 'Content-Type': 'application/json' }
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.report
    } catch (error) {
        console.error('Error fetching report:', error)
        return null
    }
}

export default async function ReportDetails({ params }) {
    const report = await getReport(params.id)

    if (!report) {
        return (
            <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
                <Navbar />
                <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Report Not Found</h1>
                    <Link href="/" className="btn btn-primary">Return Home</Link>
                </div>
            </main>
        )
    }

    const typeColor = report.type === 'WhatsApp' ? '#4ade80' :
        report.type === 'Email' ? '#a78bfa' :
            report.type === 'Social Media' ? '#60a5fa' :
                '#f87171'

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '8rem', maxWidth: '800px' }}>
                <Link href="/" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    ← Back to Home
                </Link>

                <div className="glass-panel" style={{ padding: '3rem' }}>

                    {/* Header */}
                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    background: `${typeColor}33`,
                                    color: typeColor,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase'
                                }}>
                                    {report.type} Scam
                                </span>
                                <h1 style={{ fontSize: '2rem', marginTop: '1rem', overflowWrap: 'break-word', color: 'var(--color-primary-light)' }}>
                                    {report.url}
                                </h1>
                            </div>
                            <div style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                Reported on<br />
                                <span style={{ color: 'white' }}>{new Date(report.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Incident Description</h3>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {report.reason}
                        </p>
                    </div>

                    {/* Evidence */}
                    {report.evidence_image && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Attached Evidence</h3>
                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)'
                            }}>
                                <img
                                    src={report.evidence_image}
                                    alt="Scam Evidence"
                                    style={{ width: '100%', height: 'auto', borderRadius: '0.25rem' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Disclaimer: This report was submitted by a community member. CheckItsa does not independently verify all claims. Reporter details are kept private to protect their identity.
                    </div>

                </div>
            </div>
        </main>
    )
}
