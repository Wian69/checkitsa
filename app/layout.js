import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'
import AiAssistant from '@/components/AiAssistant'

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable}`}>
        {children}
        <Footer />
        <CookieConsent />
        <AiAssistant />
      </body>
    </html>
  )
}


