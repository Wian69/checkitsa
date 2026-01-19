"use client" // Convert to Client Component for interactivity

import Link from 'next/link'
import AdBanner from '@/components/AdBanner'
import { useState, useEffect } from 'react'

import Navbar from '@/components/Navbar'
import CommunityReportsFeed from '@/components/CommunityReportsFeed'
import BusinessReviews from '@/components/BusinessReviews'
import FeaturedListings from '@/components/FeaturedListings'

export default function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check login state on mount
    const u = localStorage.getItem('checkitsa_user')
    if (u) setUser(JSON.parse(u))
  }, [])

  // Featured Intelligence Articles
  const rssItems = [
    { title: 'The Ultimate Guide to Preventing Scams (2026 Edition)', link: '/intel/scam-prevention-guide' }
  ]

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              marginBottom: '1.5rem',
              lineHeight: 1.1,
              background: 'linear-gradient(to bottom, #fff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Verify Everything.<br />Trust No One.
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--color-text-muted)',
              maxWidth: '700px',
              margin: '0 auto 3.5rem',
              lineHeight: 1.6
            }}>
              South Africa's most advanced automated verification platform. Protect yourself against phishing, fraud, and digital threats with real-time intelligence.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {!user && (
                <Link href="/signup" className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>Get Started Free</Link>
              )}
              <a href="#tools" className="btn btn-outline" style={{ padding: '1rem 2.5rem' }}>Explore Tools</a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section (Promoted Businesses) */}
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <FeaturedListings />
      </div>

      {/* Tools Section */}
      <section id="tools" className="container content-section">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Verification Suite</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Professional-grade investigative tools for everyday users.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Tile
            title="Website Scanner"
            icon="🔍"
            desc="Deep scan URLs for phishing, malware, and hidden redirects."
            href="/verify/scam"
            color="var(--color-primary)"
          />
          <Tile
            title="Email Scanning"
            icon="📧"
            desc="Verify sender identity, MX records, and domain reputation."
            href="/verify/email"
            color="#A78BFA"
          />
          <Tile
            title="Identity Check"
            icon="🆔"
            desc="Verify SA ID numbers and validate citizenship status."
            href="/verify/id"
            color="#F472B6"
          />
          <Tile
            title="Phone Lookup"
            icon="📱"
            desc="Identify carrier, location, and check spam reports."
            href="/verify/phone"
            color="#34D399"
          />
          <Tile
            title="Gambling Check"
            icon="🎰"
            desc="Verify if a betting site is legally licensed in SA."
            href="/verify/gambling"
            color="#F87171"
          />
          <Tile
            title="Road Sentinel"
            icon="🚦"
            desc="Report reckless drivers. AI extracts plates and notifies authorities."
            href="#"
            color="#F59E0B"
            badge="Coming Soon"
            locked={true}
          />
        </div>
      </section>

      {/* Affiliate Program Banner */}
      <section className="container content-section" style={{ position: 'relative' }}>
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.2) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Background Elements */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(52, 211, 153,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }}></div>

          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '2rem',
              background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7',
              fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              💸 Turn Trust into Income
            </div>

            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#fff' }}>
              Join the CheckItSA Affiliate Program
            </h2>

            <p style={{ color: '#d1d5db', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
              Help us build a safer South Africa and earn real cash. Get your unique referral link and earn <strong style={{ color: '#34d399' }}>5% recurring commission</strong> on every paid subscription you refer.
            </p>

            {/* How it CheckItSA Works Steps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>1. Join Free</h3>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Create your free account instantly. No approval wait times.</p>
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔗</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>2. Share Link</h3>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Share your unique link on WhatsApp, social media, or your website.</p>
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>3. Get Paid</h3>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Earn commissions directly to your wallet. Withdraw to any SA bank.</p>
              </div>
            </div>

            <Link href={user ? "/dashboard" : "/signup?ref=affiliate_banner"} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', background: '#10b981', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}>
              {user ? "View Affiliate Dashboard" : "Start Earning Now"}
            </Link>
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
              * Terms and conditions apply. Payouts processed within 48h.
            </p>
          </div>
        </div>
      </section>

      {/* Report CTA Section */}
      <section className="container content-section" style={{ textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '4rem 2rem', background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(167, 139, 250, 0.1))' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Have you been targeted?</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Help protect the community. Report scam numbers, profiles, and websites anonymously.
          </p>
          <Link href="/report" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem', borderRadius: '2rem' }}>
            🚨 Report an Incident
          </Link>
        </div>
      </section>

      {/* Footer Ad */}
      <div className="container" style={{ marginBottom: '2rem' }}>
        <AdBanner format="leaderboard" />
      </div>

      {/* Community Reports Section */}
      <section className="container content-section">
        <div className="glass-panel" style={{ padding: '3rem', borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1.25rem',
              fontSize: '1.5rem'
            }}>🚨</div>
            <div>
              <h2 style={{ fontSize: '2rem', color: '#fff' }}>Latest Community Reports</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>Real-time threats reported by users like you.</p>
            </div>
          </div>
          <CommunityReportsFeed />
        </div>
      </section>

      {/* Business Reviews Section (HelloPeter Style) */}
      <BusinessReviews />

      {/* Global Intel Section */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem' }}>Global Security Intel</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>The latest cybersecurity news from around the world.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {rssItems.length === 0 ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="glass-panel" style={{ height: '200px', animation: 'pulse 2s infinite' }}></div>
            ))
          ) : (
            rssItems.map((item, i) => (
              <Link key={i} href={item.link} className="glass-panel" style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                textDecoration: 'none',
                color: 'inherit'
              }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: 1.4, flex: 1 }}>{item.title}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>Read Article →</div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function Tile({ title, icon, desc, href, color, badge, opacity = 1, locked = false }) {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Link
        href={locked ? "#" : href}
        onClick={(e) => {
          if (locked) {
            e.preventDefault();
            alert("This feature is currently in development and will be coming soon!");
          }
        }}
        className={`glass-panel hover-card ${locked ? 'locked-tile' : ''}`}
        style={{
          padding: '2rem',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
          opacity: locked ? 0.6 : opacity,
          cursor: locked ? 'not-allowed' : 'pointer',
          filter: locked ? 'grayscale(0.5)' : 'none',
          textDecoration: 'none',
          color: 'inherit'
        }}>
        {badge && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: locked ? 'rgba(245, 158, 11, 0.2)' : `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.2)`,
            padding: '0.4rem 0.8rem',
            borderRadius: '2rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: locked ? '#F59E0B' : color,
            border: `1px solid ${locked ? '#F59E0B' : color}44`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            zIndex: 2
          }}>
            {badge}
          </div>
        )}

        <div>
          <div className="icon-container" style={{
            width: '3.5rem',
            height: '3.5rem',
            background: `rgba(${parseInt(color.slice(1, 3), 16) || 99}, ${parseInt(color.slice(3, 5), 16) || 102}, ${parseInt(color.slice(5, 7), 16) || 241}, 0.1)`,
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            border: `1px solid ${color}33`,
            boxShadow: `0 4px 20px -5px ${color}22`
          }}>{icon}</div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>{title}</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>{desc}</p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          color: locked ? 'var(--color-text-muted)' : color,
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          {locked ? 'Coming Soon' : 'Access Tool'} <span className="arrow-icon" style={{ marginLeft: '0.5rem' }}>→</span>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: '3px',
          background: locked ? 'linear-gradient(90deg, #F59E0B 0%, transparent 100%)' : `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
          opacity: 0.5
        }}></div>
      </Link>
    </div>
  )
}
