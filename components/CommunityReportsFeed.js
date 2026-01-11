"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function CommunityReportsFeed() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

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

    return (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {reports.map(report => (
                <div key={report.id} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
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
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-primary-light)', marginBottom: '0.5rem' }}>
                        {report.url}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', opacity: 0.9, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {report.reason}
                    </div>
                    {/* Visual indicator if evidence exists (future proofing) */}
                    {report.has_evidence && (
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            📎 Evidence Attached
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
