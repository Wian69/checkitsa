import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'CheckItSA - Verify Scams, Gambling & ID',
  description: 'South Africa\'s most trusted verification platform. Scan websites, phone numbers, and businesses for scams in real-time.',
  openGraph: {
    title: 'CheckItSA - Stop Scams in South Africa',
    description: 'Verify anything before you trust. The #1 platform to combat fraud in SA.',
    url: 'https://checkitsa.co.za',
    siteName: 'CheckItSA',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CheckItSA Security Platform',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CheckItSA - Stop Scams in South Africa',
    description: 'Verify anything before you trust. The #1 platform to combat fraud in SA.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'googlea70a4df600e41289',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable}`}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          <div className="glass-panel" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto', borderTop: '4px solid #f59e0b', background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
            <h1 className="font-outfit" style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' }}>Site Under Maintenance</h1>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              We are currently upgrading our payment systems and performing scheduled maintenance. CheckItSA will be back online shortly. Thank you for your patience!
            </p>
            <div style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
              CheckItSA Security Team
            </div>
          </div>
        </main>
        <div style={{ display: 'none' }}>
          {children}
        </div>
      </body>
    </html>
  )
}


