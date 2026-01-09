"use client"
import Navbar from '@/components/Navbar'
export const runtime = 'edge'
import ReportButton from '@/components/ReportButton'
import { useState } from 'react'

export default function FinesCheck() {
    const [inputType, setInputType] = useState('id')
    const [inputValue, setInputValue] = useState('')

    const handleSearch = (serviceUrl) => {
        // In a real scenario we might pass query params, but fine portals usually block deep linking for security.
        // We simulate the 'handoff'.
        window.open(serviceUrl, '_blank')
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '8rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Traffic Fines</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                    Check and pay outstanding fines via official secured portals.
                </p>

                <div className="glass-panel" style={{ padding: '2.5rem' }}>

                    {/* Mock Search Form to capture Intent */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button onClick={() => setInputType('id')} className={`btn ${inputType === 'id' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>By ID Number</button>
                            <button onClick={() => setInputType('notice')} className={`btn ${inputType === 'notice' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>By Notice Number</button>
                        </div>

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={inputType === 'id' ? "Enter ID Number" : "Enter Notice Number"}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--color-border)',
                                color: 'white',
                                outline: 'none',
                                fontSize: '1.25rem',
                                marginBottom: '1.5rem'
                            }}
                        />

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
                            Select a service provider to proceed with secure check:
                        </p>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <button onClick={() => handleSearch('https://www.paycity.co.za/traffic-fines')} className="btn btn-outline" style={{ justifyContent: 'space-between', borderColor: 'var(--color-primary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔵 Check via <strong>PayCity</strong></span>
                                <span>Proceed &rarr;</span>
                            </button>
                            <button onClick={() => handleSearch('https://www.aarto.co.za/')} className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                                <span>⚪ Check via <strong>AARTO</strong> (National)</span>
                                <span>Proceed &rarr;</span>
                            </button>
                            <button onClick={() => handleSearch('https://online.natis.gov.za/')} className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                                <span>🟢 Check via <strong>Natis</strong></span>
                                <span>Proceed &rarr;</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Found a fraudulent fine notice?</p>
                        <ReportButton url="" type="General" reason="Fraudulent Fine Notice" />
                    </div>

                </div>
            </div>
        </main>
    )
}
