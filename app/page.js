import Link from 'next/link'
// export const runtime = 'edge'

import Navbar from '@/components/Navbar'
import ScamReportForm from '@/components/ScamReportForm'

// Helper to get RSS
async function getRSSFeed() {
  // DEBUG: Mocking RSS to isolate render issues
  return [
    { title: 'Debug: RSS Feed Loaded', link: '#' },
    { title: 'System All Green', link: '#' }
  ]
}

// Helper to get Community Reports
async function getCommunityReports() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/report`, {
      next: { revalidate: 10 },
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.reports || []
  } catch (e) {
    console.error('Community Reports Fetch Error:', e)
    return []
  }
}

export default async function Home() {
  // const rssItems = await getRSSFeed()
  const reportedSites = await getCommunityReports()

  // Use mock data for RSS only
  const rssItems = [
    { title: 'Security Alert: Verify Now', link: '#' },
    { title: 'Global Cyber Watch', link: '#' }
  ]

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        paddingTop: '10rem',
        paddingBottom: '6rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '2rem',
              color: 'var(--color-primary-light)',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Design Update v2.0 Live
            </div>
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
              <Link href="/signup" className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>Get Started Free</Link>
              <a href="#tools" className="btn btn-outline" style={{ padding: '1rem 2.5rem' }}>Explore Tools</a>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="container" style={{ marginBottom: '8rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Verification Suite</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Professional-grade investigative tools for everyday users.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
            title="Business Verify"
            icon="🏢"
            desc="Cross-reference CIPC and external data for legitimacy."
            href="/verify/business"
            color="#FBBF24"
          />
          <Tile
            title="Phone Lookup"
            icon="📱"
            desc="Identify carrier, location, and check spam reports."
            href="/verify/phone"
            color="#34D399"
          />
          <Tile
            title="Image Analysis"
            icon="🖼️"
            desc="Scan screenshots for hidden scam text and patterns."
            href="/verify/image"
            color="#ec4899"
          />
          <Tile
            title="Gambling Check"
            icon="🎰"
            desc="Verify if a betting site is legally licensed in SA."
            href="/verify/gambling"
            color="#F87171"
          />
          <Tile
            title="Traffic Fines"
            icon="🚔"
            desc="Search and check for outstanding traffic violations."
            href="/verify/fines"
            color="#6366f1"
          />
        </div>
      </section>

      {/* Report CTA Section */}
      <section className="container" style={{ marginBottom: '8rem', textAlign: 'center' }}>
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

      {/* Community Reports Section */}
      <section className="container" style={{ marginBottom: '8rem' }}>
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

          {reportedSites.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No recent reports. Stay safe!</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {reportedSites.map(report => (
                <div key={report.id} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '1rem',
                      background: report.type === 'WhatsApp' ? 'rgba(34, 197, 94, 0.2)' :
                        report.type === 'Email' ? 'rgba(167, 139, 250, 0.2)' :
                          report.type === 'Social Media' ? 'rgba(59, 130, 246, 0.2)' :
                            'rgba(239, 68, 68, 0.2)',
                      color: report.type === 'WhatsApp' ? '#4ade80' :
                        report.type === 'Email' ? '#a78bfa' :
                          report.type === 'Social Media' ? '#60a5fa' :
                            '#f87171'
                    }}>{report.type.toUpperCase()} SCAM</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(report.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-primary-light)', marginBottom: '0.5rem' }}>
                    {report.url}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', opacity: 0.9, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {report.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
              <a key={i} href={item.link} target="_blank" className="glass-panel" style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s'
              }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: 1.4, flex: 1 }}>{item.title}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>Read Article →</div>
              </a>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function Tile({ title, icon, desc, href, color }) {
  return (
    <Link href={href} className="glass-panel" style={{
      padding: '2rem',
      textAlign: 'left',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '3.5rem',
        height: '3.5rem',
        background: `rgba(${parseInt(color.slice(1, 3), 16) || 99}, ${parseInt(color.slice(3, 5), 16) || 102}, ${parseInt(color.slice(5, 7), 16) || 241}, 0.1)`,
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        marginBottom: '1.5rem',
        border: `1px solid ${color}33`
      }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{title}</h3>
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{desc}</p>

      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        height: '2px',
        background: color,
        opacity: 0.3
      }}></div>
    </Link>
  )
}
