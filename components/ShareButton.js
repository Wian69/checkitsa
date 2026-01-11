
"use client"
import { useState } from 'react'

export default function ShareButton({ type, query, status, message }) {
    const [copied, setCopied] = useState(false)

    // Constructing the viral message
    const constructedMessage = message || `⚠️ SCAM ALERT: I just checked "${query}" on CheckItSA and it was flagged as "${status}". \n\nProtect yourself and check any site or number here: https://checkitsa.co.za`
    const encodedMessage = encodeURIComponent(constructedMessage)

    const handleWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(constructedMessage)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
                onClick={handleWhatsApp}
                className="btn"
                style={{
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flex: 1,
                    justifyContent: 'center'
                }}
            >
                <span>💬</span> Share to WhatsApp
            </button>
            <button
                onClick={handleCopy}
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
            >
                {copied ? '✅ Copied' : '🔗 Copy Text'}
            </button>
        </div>
    )
}
