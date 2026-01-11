"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const [user, setUser] = useState(null)
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const u = localStorage.getItem('checkitsa_user')
        if (u) setUser(JSON.parse(u))

        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
    }, [mobileMenuOpen])

    const handleLogout = () => {
        localStorage.removeItem('checkitsa_user')
        localStorage.removeItem('checkitsa_tier')
        setUser(null)
        setMobileMenuOpen(false)
        router.push('/')
    }

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: scrolled ? '1rem 0' : '1.5rem 0',
            background: scrolled || mobileMenuOpen ? 'rgba(3, 7, 18, 0.95)' : 'transparent',
            backdropFilter: scrolled || mobileMenuOpen ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: scrolled || mobileMenuOpen ? 'blur(16px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#fff',
                    textDecoration: 'none',
                    letterSpacing: '-0.04em',
                    position: 'relative',
                    zIndex: 1001 // Above overlay
                }} onClick={() => setMobileMenuOpen(false)}>
                    <span style={{ color: 'var(--color-primary)' }}>CheckIt</span>SA
                </Link>

                {/* Desktop Nav */}
                <div className="desktop-only" style={{ display: 'flex', gap: '2.5rem', fontWeight: 500, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="nav-links">
                        <Link href="/" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>Home</Link>
                        <Link href="/#tools" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>Services</Link>
                        <Link href="/subscription" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>Pricing</Link>
                        <Link href="/about" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>About</Link>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                        {user ? (
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                <Link href="/dashboard" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textDecoration: 'none', borderBottom: '1px solid transparent', transition: 'border-color 0.2s' }} className="hover:text-white">
                                    Dashboard
                                </Link>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    Hi, <span style={{ color: '#fff', fontWeight: 600 }}>{user.fullName.split(' ')[0]}</span>
                                </span>
                                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: '0.5rem' }}>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Link href="/signup" className="btn btn-outline" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', borderRadius: '0.5rem' }}>
                                    Sign Up
                                </Link>
                                <Link href="/login" className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', borderRadius: '0.5rem' }}>
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-only"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        zIndex: 1001,
                        padding: '0.5rem'
                    }}
                >
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Nav Overlay */}
            <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'open' : ''}`}>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 600 }}>Home</Link>
                <Link href="/#tools" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 600 }}>Services</Link>
                <Link href="/subscription" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 600 }}>Pricing</Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 600 }}>About</Link>
                <Link href="/report" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary-light)' }}>Report Incident</Link>

                <div style={{ height: '1px', background: 'var(--color-border)', margin: '1rem 0' }}></div>

                {user ? (
                    <>
                        <div style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>
                            Signed in as <span style={{ color: '#fff' }}>{user.fullName}</span>
                        </div>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', margin: '1rem 0' }}>
                            Go to Dashboard
                        </Link>
                        <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                            Sign In
                        </Link>
                        <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Get Started
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    )
}
