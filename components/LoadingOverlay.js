
"use client"

export default function LoadingOverlay({ message = "Analyzing Data..." }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.3s ease'
        }}>
            {/* Rotating Triangle */}
            <div style={{
                width: '0',
                height: '0',
                borderLeft: '40px solid transparent',
                borderRight: '40px solid transparent',
                borderBottom: '70px solid var(--color-primary)',
                filter: 'drop-shadow(0 0 20px var(--color-primary))',
                animation: 'rotate360 2s linear infinite',
                marginBottom: '2.5rem'
            }}></div>

            <div style={{ textAlign: 'center' }}>
                <h3 style={{
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                }}>{message}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Fetching real-time intelligence for your safety...
                </p>
            </div>

            <style jsx>{`
                @keyframes rotate360 {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
