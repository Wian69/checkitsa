'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function PrivacyCleanPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !name || !email) return;
    
    setIsSearching(true);
    
    // Simulate a deep search taking a few seconds
    await new Promise(r => setTimeout(r, 2000));
    
    // Save details to localStorage so they persist through checkout
    localStorage.setItem('privacy_clean_target', JSON.stringify({
      name,
      email,
      phoneNumber
    }));

    // Redirect to subscription/pricing page
    router.push('/subscription?source=privacy-clean');
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

            <div style={{ marginTop: '1rem' }}>
              <button 
                type="submit"
                disabled={isSearching}
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
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
                By searching, you agree to our POPIA-compliant terms of service.
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
