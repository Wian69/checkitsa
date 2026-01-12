"use client"
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function ScamPreventionGuide() {
    const sections = [
        {
            id: "banking",
            title: "1. Banking & EFT Scams",
            icon: "🏦",
            content: `The most common banking scam in South Africa involves social engineering. Scammers often pose as bank officials claiming there is a "fraudulent transaction" on your account.
            
            Key Red Flags:
            • Being asked to install remote access software like AnyDesk or TeamViewer.
            • Requesting your One-Time Pin (OTP) or App Approval.
            • Urgency: Telling you that you must act "right now" to save your money.`
        },
        {
            id: "facebook",
            title: "2. Facebook & Social Media Fraud",
            icon: "👥",
            content: `Facebook Marketplace is a hotspot for localized fraud. Sellers often request "deposits" for items that don't exist, or buyers send fake "Proof of Payment" documents.
            
            Key Red Flags:
            • Prices that are "too good to be true."
            • Sellers who refuse to meet in a safe, public place.
            • Profiles that were created very recently (check the "Joined Facebook" date).`
        },
        {
            id: "email",
            title: "3. Email Phishing & BEC",
            icon: "📧",
            content: `Business Email Compromise (BEC) targets both companies and individuals. Scammers spoof the email addresses of lawyers, contractors, or even SARS.
            
            Key Red Flags:
            • Sudden changes to banking details for an invoice.
            • Emails from "SARS" regarding a refund that requires you to click a link.
            • Generic greetings like "Dear Valued Customer" instead of your name.`
        },
        {
            id: "website",
            title: "4. Website & Online Store Clones",
            icon: "🌐",
            content: `Scammers often clone popular South African retail websites. They look identical but are designed to steal your credit card information.
            
            Key Red Flags:
            • Misspelled URLs (e.g., 'takeal0t.co.za' instead of 'takealot.com').
            • Lack of contact information or a physical address.
            • Only accepting manual EFT or Crypto as payment.`
        }
    ]

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '900px' }}>
                <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back to Security Hub
                </Link>

                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                    The Ultimate Guide to <span style={{ color: 'var(--color-primary)' }}>Preventing Scams</span> in South Africa
                </h1>

                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginBottom: '4rem', lineHeight: 1.6 }}>
                    As digital fraud becomes more sophisticated, staying informed is your first line of defense.
                    This guide covers the most prevalent threats moving through South Africa today and how you can protect yourself in 2026.
                </p>

                <div style={{ display: 'grid', gap: '3rem' }}>
                    {sections.map((section, index) => (
                        <div key={index} id={section.id} className="glass-panel" style={{ padding: '2.5rem', scrollMarginTop: '10rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '2.5rem' }}>{section.icon}</span>
                                <h2 style={{ fontSize: '1.8rem' }}>{section.title}</h2>
                            </div>
                            <div style={{
                                whiteSpace: 'pre-line',
                                color: 'var(--color-text-muted)',
                                lineHeight: 1.8,
                                fontSize: '1.1rem'
                            }}>
                                {section.content}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-panel" style={{ marginTop: '4rem', padding: '3rem', border: '1px solid var(--color-primary)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>🛡️ 5 Golden Rules for Safety</h2>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1.5rem' }}>
                        <li style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>01.</span>
                            <span><strong>Never Share Your OTP:</strong> No bank official will ever ask for your One-Time Pin or to approve a prompt on your app.</span>
                        </li>
                        <li style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>02.</span>
                            <span><strong>Verify Before You Trust:</strong> Use CheckItSA's Website and Phone scanners to check any link or number before engaging.</span>
                        </li>
                        <li style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>03.</span>
                            <span><strong>Enable 2FA:</strong> Always use Two-Factor Authentication (preferring apps like Google Authenticator over SMS) on all accounts.</span>
                        </li>
                        <li style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>04.</span>
                            <span><strong>Check the URL:</strong> Always look at the address bar. If it's not exactly what you expect, close the tab.</span>
                        </li>
                        <li style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>05.</span>
                            <span><strong>Trust Your Gut:</strong> If a deal or conversation feels strange, it probably is. Scammers rely on creating pressure.</span>
                        </li>
                    </ul>
                </div>

                <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Want to report a scam?</h3>
                    <Link href="/report" className="btn btn-primary">🚨 Report an Incident</Link>
                </div>
            </div>
        </main>
    )
}
