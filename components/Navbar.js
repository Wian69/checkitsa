"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const [user, setUser] = useState(null)
    const [scrolled, setScrolled] = useState(false)
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

    const handleLogout = () => {
        localStorage.removeItem('checkitsa_user')
        localStorage.removeItem('checkitsa_tier')
        setUser(null)
        router.push('/')
    }

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: scrolled ? '1rem 2rem' : '1.5rem 2rem',
            background: scrolled ? 'rgba(3, 7, 18, 0.85)' : 'transparent',
            backdropFilter: scrolled ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 0 }}>
                <Link href="/" style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#fff',
                    textDecoration: 'none',
                    letterSpacing: '-0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}>
                    <span style={{ color: 'var(--color-primary)' }}>CheckIt</span>SA
                </Link>

                <div style={{ display: 'flex', gap: '2.5rem', fontWeight: 500, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="nav-links">
                        <Link href="/" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>Home</Link>
                        <Link href="/#tools" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>Services</Link>
                        <Link href="/subscription" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>Pricing</Link>
                        <Link href="/about" style={{ fontSize: '0.9375rem', opacity: 0.8 }}>About</Link>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                        {user ? (
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
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
            </div>
        </nav>
    )
}
