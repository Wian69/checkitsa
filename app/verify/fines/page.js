"use client"
import Navbar from '@/components/Navbar'


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
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            To report a fraudulent fine, please use the <a href="/report" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Report Incident</a> feature.
                        </p>
                    </div>

                </div>
            </div>

            {/* Blocking Overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(5px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', textAlign: 'center', border: '1px solid var(--color-primary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🚧</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'white' }}>Coming Soon</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        This feature is still in development and will be available soon.
                    </p>
                    <a href="/" className="btn btn-primary">Return Home</a>
                </div>
            </div>
        </main>
    )
}
