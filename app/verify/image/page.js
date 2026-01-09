"use client"
import Navbar from '@/components/Navbar'
import ReportButton from '@/components/ReportButton'
import { useState } from 'react'
import { trackSearch } from '@/utils/searchLimit'
import { useRouter } from 'next/navigation'

export default function ImageScanner() {
    const [file, setFile] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState(null)
    const router = useRouter()

    const handleFileChange = (e) => {
        const f = e.target.files[0]
        if (f) {
            setFile(f)
            setPreview(URL.createObjectURL(f))
            setResult(null)
        }
    }

    const handleScan = async (e) => {
        e.preventDefault()
        if (!file) return

        setLoading(true)
        const formData = new FormData()
        formData.append('image', file)

        try {
            const res = await fetch('/api/verify/image', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            setResult(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Screenshot Scanner</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                    Upload screenshots of SMS, WhatsApps, or Emails to check for hidden scam text.
                </p>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ border: '2px dashed var(--color-border)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                        {preview ? (
                            <img src={preview} alt="Upload Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.5rem', marginBottom: '1rem' }} />
                        ) : (
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-block' }}>
                            {file ? 'Change Image' : 'Select Image'}
                        </label>
                    </div>

                    {file && !result && (
                        <button onClick={handleScan} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                            {loading ? 'Scanning Text...' : 'Analyze Screenshot'}
                        </button>
                    )}

                    {result && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{
                                padding: '1.5rem',
                                borderRadius: '0.5rem',
                                background: result.risk_score > 50 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                border: `1px solid ${result.risk_score > 50 ? 'var(--color-danger)' : 'var(--color-success)'}`,
                                marginBottom: '1.5rem'
                            }}>
                                <h3 style={{ color: result.risk_score > 50 ? 'var(--color-danger)' : 'var(--color-success)', marginBottom: '0.5rem' }}>
                                    {result.message}
                                </h3>
                                {result.flags.length > 0 && (
                                    <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                                        {result.flags.map((f, i) => <li key={i}>{f}</li>)}
                                    </ul>
                                )}
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Extracted Text:</div>
                                <p style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '0.9rem' }}>"{result.text_extracted}"</p>
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <ReportButton url={file?.name || 'Screenshot'} type="General" reason="Scam Screenshot" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
