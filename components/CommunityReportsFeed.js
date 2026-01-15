"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import EvidenceViewer from './EvidenceViewer'

export default function CommunityReportsFeed() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter() // Import usage requires 'next/navigation'

    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await fetch('/api/report')
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                setReports(data.reports || [])
            } catch (error) {
                console.error('Failed to load reports:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [])

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                Loading community reports...
            </div>
        )
    }

    if (reports.length === 0) {
        return (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                No recent reports. Stay safe!
            </p>
        )
    }

    const handleCardClick = (id) => {
        router.push(`/report/${id}`)
    }

    return (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {reports.map(report => (
                <div
                    key={report.id}
                    onClick={() => handleCardClick(report.id)}
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'block',
                        textDecoration: 'none',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '1rem',
                            background: report.type === 'WhatsApp' ? 'rgba(34, 197, 94, 0.2)' :
                                report.type === 'Email' ? 'rgba(167, 139, 250, 0.2)' :
                                    report.type === 'Social Media' ? 'rgba(59, 130, 246, 0.2)' :
                                        'rgba(239, 68, 68, 0.2)',
                            color: report.type === 'WhatsApp' ? '#4ade80' :
                                report.type === 'Email' ? '#a78bfa' :
                                    report.type === 'Social Media' ? '#60a5fa' :
                                        '#f87171'
                        }}>{report.type.toUpperCase()} SCAM</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(report.date).toLocaleDateString()}</span>
                    </div>

                    {/* Clickable URL/Target - Stops propagation to prevent card click */}
                    <div
                        style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-primary-light)', marginBottom: '0.5rem', position: 'relative', zIndex: 10 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {report.url && (report.url.startsWith('http') || report.url.startsWith('www')) ? (
                            <a
                                href={report.url.startsWith('www') ? `https://${report.url}` : report.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}
                                className="hover:text-white"
                            >
                                {report.url} 🔗
                            </a>
                        ) : (
                            report.url
                        )}
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', opacity: 0.9, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {report.reason}
                    </div>

                    {/* Visual indicator if evidence exists */}
                    {/* Visual indicator / Viewer if evidence exists */}
                    {report.has_evidence && (
                        <div style={{ marginTop: '0.8rem' }} onClick={(e) => e.stopPropagation()}>
                            <EvidenceViewer image={report.evidence_image} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
