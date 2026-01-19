"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }) {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        // Check for user in localStorage
        const user = localStorage.getItem('checkitsa_user')

        if (!user) {
            // Store current path to redirect back after login (optional enhancement)
            // sessionStorage.setItem('redirect_after_login', window.location.pathname)
            router.push('/signup')
        } else {
            setAuthorized(true)
        }
    }, [router])

    // Show nothing while checking auth to prevent flash of content
    if (!authorized) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#030712',
                color: 'var(--color-primary)'
            }}>
                <div className="spinner"></div>
                <style jsx>{`
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(255,255,255,0.1);
                        border-radius: 50%;
                        border-top-color: var(--color-primary);
                        animation: spin 1s ease-in-out infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    return <>{children}</>
}
