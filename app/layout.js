import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'CheckItSA - Verify Scams, Gambling & ID',
  description: 'South Africa\'s most trusted verification platform. Scam checks, gambling site verification, and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable}`}>
        {children}
        <Footer />
        <CookieConsent />
      </body>
    </html>
  )
}
