'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import dataBrokers from '@/app/lib/dataBrokers.json';

export default function PrivacyCleanPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [exposedBrokers, setExposedBrokers] = useState([]);
  const [hasAuthorized, setHasAuthorized] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !name || !email || !hasAuthorized) return;

    // Simulate scanning to build anticipation
    setIsSearching(true);
    
    try {
        // CALL THE LIVE WEB SCRAPER
        const scanRes = await fetch('/api/deep-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone: phoneNumber })
        });
        
        const scanData = await scanRes.json();
        const liveMatches = scanData.matches || [];

        setExposedBrokers(liveMatches);

        // If they have matches, we generate the checkout. If 0 matches, they are safe and we don't need checkout.
        if (liveMatches.length > 0) {
            const res = await fetch('/api/create-yoco-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountInCents: 19900,
                    name: name,
                    email: email,
                    phone: phoneNumber,
                    returnUrl: window.location.origin + '/privacy-clean'
                })
            });

            const data = await res.json();

            if (res.ok) {
                setCheckoutUrl(data.redirectUrl);
                localStorage.setItem('pending_privacy_checkout', data.checkoutId);
            } else {
                console.error("Payment system error:", data);
                // Fail silently on payment error so we still show them the results at least
            }
        }

        localStorage.setItem('privacy_clean_target', JSON.stringify({ name, email, phoneNumber }));
        localStorage.setItem('privacy_clean_brokers', JSON.stringify(liveMatches));

        // Ensure the "scan" takes at least 2 seconds for dramatic effect while the scraper runs
        await new Promise(r => setTimeout(r, 2000));
        
        setIsSearching(false);
        setScanComplete(true); // Show the results screen

    } catch (e) {
        console.error("Deep Scan error:", e);
        alert("Unable to connect to scanning servers. Please try again.");
        setIsSearching(false);
    }
  };

  const handleUnlock = () => {
      setIsRedirecting(true);
      window.location.href = checkoutUrl;
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <Navbar />
      
      <section className="hero-section" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            marginBottom: '1rem',
            lineHeight: 1.1,
            background: 'linear-gradient(to right, #fff 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800
          }}>
            Data Privacy Scanner
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--color-text-muted)',
            maxWidth: '700px',
            margin: '0 auto 2rem',
            lineHeight: 1.6
          }}>
            Find and remove your personal details from Truecaller, direct marketing lists, and caller ID apps instantly under the POPI Act.
          </p>
        </div>
      </section>

      <section className="container content-section">
        <div className="glass-panel" style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '3rem',
          borderTop: '4px solid #10b981',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#10b981'
            }}>🔍</div>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Initiate Deep Scan</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Enter the details you want to scrub from the internet.</p>
            </div>
          </div>

          {!scanComplete ? (
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 500 }}>
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  placeholder="Nelson Mandela"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 500 }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  placeholder="nelson@example.co.za"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 500 }}>
                  South African Phone Number
                </label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  placeholder="+27 82 123 4567"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <input 
                  type="checkbox" 
                  id="legal-auth"
                  checked={hasAuthorized}
                  onChange={(e) => setHasAuthorized(e.target.checked)}
                  required
                  style={{ marginTop: '0.25rem', width: '1.2rem', height: '1.2rem', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <label htmlFor="legal-auth" style={{ color: '#d1d5db', fontSize: '0.85rem', lineHeight: 1.5, cursor: 'pointer' }}>
                  <strong>Legal Authorization:</strong> I authorize CheckIt SA to act as my legal agent to submit POPIA and GDPR data erasure requests on my behalf. I understand that CheckIt SA facilitates these requests but cannot guarantee third-party broker compliance, and is not liable for brokers who refuse to delete data.
                </label>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button 
                  type="submit"
                  disabled={isSearching || !hasAuthorized}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    fontSize: '1.1rem',
                    justifyContent: 'center',
                    background: isSearching ? '#374151' : '#10b981',
                    color: '#fff',
                    boxShadow: isSearching ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                    opacity: isSearching ? 0.7 : 1,
                    cursor: isSearching ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSearching ? 'Scanning Databases...' : 'Search My Details'}
                </button>
                <p style={{ textAlign: 'center', color: 'var(--color-primary-light)', fontSize: '0.9rem', marginTop: '1.5rem', fontWeight: 500 }}>
                  ⚠️ This is a one-time dispatch service for R199. <br/>
                  <span style={{color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 'normal'}}>CheckIt SA operates strictly as an authorized agent for POPIA compliance.</span>
                </p>
              </div>
            </form>
          ) : exposedBrokers.length === 0 ? (
            <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛡️</div>
                <h2 style={{ fontSize: '2rem', color: '#10b981', marginBottom: '1rem', fontWeight: 800 }}>Great News! Your Data is Safe.</h2>
                <p style={{ color: '#e5e7eb', fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '500px', lineHeight: 1.6 }}>
                    We ran a deep web scan on your email (<strong>{email}</strong>) and phone number (<strong>{phoneNumber}</strong>) and found <strong>0 public matches</strong>.
                </p>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '1.5rem', borderRadius: '0.5rem', maxWidth: '500px', marginBottom: '2rem' }}>
                    <p style={{ margin: 0, color: '#86efac' }}>
                        Because your digital footprint is clean, you do <strong>not</strong> need to pay for our POPIA deletion service! Keep up the good work protecting your privacy.
                    </p>
                </div>
                <button 
                    onClick={() => { setScanComplete(false); setEmail(''); setPhoneNumber(''); }}
                    className="btn btn-outline"
                    style={{ padding: '1rem 2rem' }}
                >
                    Scan Another Identity
                </button>
            </div>
          ) : (
            <div style={{ position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {/* Blurred Results Background */}
                <div style={{ width: '100%', filter: 'blur(6px)', opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }}>
                    <h3 style={{ color: '#ef4444', marginBottom: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>
                        {exposedBrokers.length} Public Matches Found
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', maxHeight: '400px', overflow: 'hidden' }}>
                        {exposedBrokers.map((broker, idx) => (
                            <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: `4px solid ${broker.risk === 'HIGH RISK' ? '#ef4444' : '#f59e0b'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{broker.name}</div>
                                    <span style={{ fontSize: '0.8rem', background: broker.risk === 'HIGH RISK' ? '#ef4444' : '#f59e0b', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>{broker.risk}</span>
                                </div>
                                <div style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Domain: <strong>{broker.url}</strong></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clear Overlay Call to Action */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '105%',
                    background: 'rgba(17, 24, 39, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '2.5rem 2rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
                    <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem' }}>Your Data is Exposed</h2>
                    <p style={{ color: '#e5e7eb', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                        We just scraped the web and found your details exposed on <strong>{exposedBrokers.length} public databases</strong> (including {exposedBrokers[0]?.name}).
                    </p>
                    
                    <button 
                        onClick={handleUnlock}
                        disabled={isRedirecting || !checkoutUrl}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            fontSize: '1.1rem',
                            justifyContent: 'center',
                            background: isRedirecting ? '#374151' : '#10b981',
                            color: '#fff',
                            boxShadow: isRedirecting ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                            borderRadius: '2rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem'
                        }}
                    >
                        {isRedirecting ? 'Connecting to Secure Checkout...' : 'Pay R199 to Dispatch Legal Erasure Requests'}
                    </button>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem', lineHeight: 1.6, textAlign: 'left' }}>
                            <strong>Disclaimer:</strong> CheckIt SA acts as your Authorized Legal Agent to dispatch POPIA Data Erasure Requests to the domains found in this scan. By proceeding, you authorize us to submit these requests on your behalf.
                        </p>
                    </div>
                    
                    <p style={{ marginTop: '1.5rem', color: '#6b7280', fontSize: '0.8rem' }}>
                        100% Secure Checkout via Yoco. Apple Pay & Google Pay accepted.
                    </p>
                </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
