"use client"

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Script from 'next/script'

export default function AdvertisePage() {
  const [formData, setFormData] = useState({
    businessName: '',
    websiteUrl: '',
    description: '',
    category: 'Security',
    logoUrl: ''
  })
  const [status, setStatus] = useState('idle') // idle, submitting, paying, success, error
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    
    try {
      const res = await fetch('/api/advertise/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')

      // Initiation Yoco Payment
      startPayment(data.listingId, data.amount)
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const startPayment = (listingId, amount) => {
    if (typeof window.YocoSDK === 'undefined') {
      setStatus('error')
      setMessage('Yoco SDK not loaded. Please refresh.')
      return
    }

    const yoco = new window.YocoSDK({
      publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY
    })

    setStatus('paying')
    yoco.showPopup({
      amountInCents: amount * 100,
      currency: 'ZAR',
      name: formData.businessName,
      description: 'CheckItSA 30-Day Verified Listing',
      callback: async (result) => {
        if (result.error) {
          setStatus('error')
          setMessage(result.error.message)
        } else {
          // Send token to backend
          processPayment(listingId, result.id)
        }
      }
    })
  }

  const processPayment = async (listingId, token) => {
    try {
      const res = await fetch('/api/advertise/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, token })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment confirmation failed')

      setStatus('success')
      setMessage('Your listing is now live!')
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <Navbar />
      <Script src="https://js.yoco.com/sdk/v1/yoco-sdk-web.js" />

      <section className="container" style={{ paddingTop: '8rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                marginBottom: '1rem',
                background: 'linear-gradient(to bottom, #fff 0%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Promote Your Business
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                Build trust with South Africans. Get a "Verified" badge and appear at the top of our search results.
            </p>
        </div>

        <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
                <h2 style={{ marginBottom: '1rem' }}>Payment Successful!</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
                  Your business "{formData.businessName}" is now featured as a Verified Partner on CheckItSA.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <a href="/" className="btn btn-primary">Back to Home</a>
                    <button onClick={() => setStatus('idle')} className="btn btn-outline">Post Another Ad</button>
                </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Business Name</label>
                <input 
                  type="text" 
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Secure Solutions Pty Ltd"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Website URL</label>
                <input 
                  type="url" 
                  name="websiteUrl"
                  required
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.co.za"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Category</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    outline: 'none'
                  }}
                >
                    <option value="Security">Security & Cyber</option>
                    <option value="Finance">Financial Services</option>
                    <option value="Legal">Legal & Professional</option>
                    <option value="Retail">Retail & E-commerce</option>
                    <option value="Other">Other Services</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>Description (Brief)</label>
                <textarea 
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What makes your business trustworthy?"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    height: '100px',
                    outline: 'none'
                  }}
                ></textarea>
              </div>

              <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>30-Day Listing</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Verified Badge + Top Spot</p>
                      </div>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>R150.00</span>
                  </div>
              </div>

              {status === 'error' && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.5rem' }}>
                    ⚠️ {message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'submitting' || status === 'paying'}
                className="btn btn-primary" 
                style={{ height: '3.5rem', fontSize: '1.1rem' }}
              >
                {status === 'submitting' ? 'Saving Details...' : status === 'paying' ? 'Awaiting Payment...' : 'Secure Checkout via Yoco'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Payments secured by Yoco. All listings are subject to verification.
              </p>
            </form>
          )}
        </div>
      </section>

      <style jsx>{`
        input::placeholder, textarea::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        select option {
          background: #111827;
          color: white;
        }
      `}</style>
    </main>
  )
}
