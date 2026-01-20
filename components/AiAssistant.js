"use client"
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hello! I\'m Cipher. What do you need to verify today?', action: null }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const router = useRouter()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            })

            const data = await res.json()

            setMessages(prev => [...prev, {
                role: 'bot',
                text: data.reply || "I didn't quite catch that.",
                action: data.action
            }])
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: "Connection error. Please try again." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: 'var(--font-inter)' }}>

            {/* Chat Body */}
            {isOpen && (
                <div className="glass-panel" style={{
                    width: '350px',
                    height: '500px',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{ fontSize: '1.5rem' }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Cipher AI</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Security Assistant</div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                        >×</button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '1rem',
                                    borderBottomLeftRadius: m.role === 'bot' ? '0.2rem' : '1rem',
                                    borderBottomRightRadius: m.role === 'user' ? '0.2rem' : '1rem',
                                    background: m.role === 'user' ? '#4f46e5' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                }}>
                                    {m.text}
                                </div>
                                {m.action && (
                                    <button
                                        onClick={() => {
                                            router.push(m.action.url)
                                            setIsOpen(false)
                                        }}
                                        style={{
                                            marginTop: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            color: '#34d399',
                                            border: '1px solid rgba(16, 185, 129, 0.4)',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {m.action.label} <span>→</span>
                                    </button>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                                Cipher is thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a question..."
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '2rem',
                                padding: '0.5rem 1rem',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                        <button type="submit" disabled={loading} style={{
                            background: '#7c3aed',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '2.5rem',
                            height: '2.5rem',
                            cursor: loading ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            ➤
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🤖
                </button>
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
