
"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if user has already accepted
        const consent = localStorage.getItem('checkitsa_cookie_consent')
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000) // Show after 2s
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('checkitsa_cookie_consent', 'true')
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '600px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.5s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🍪</div>
                <div>
                    <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Cookies & Privacy</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        We use cookies to enhance your scan experience and sync your data securely across devices.
                        By clicking "Accept", you agree to our <Link href="/privacy" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Privacy Policy</Link> in accordance with POPIA.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Link href="/privacy" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                    Learn More
                </Link>
                <button onClick={handleAccept} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.5rem' }}>
                    Accept All
                </button>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
