'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [targetData, setTargetData] = useState(null);

    useEffect(() => {
        // Verify payment status from Yoco redirect URL
        const status = searchParams.get('status');
        if (status !== 'paid') {
            router.push('/privacy-clean');
            return;
        }

        const data = localStorage.getItem('privacy_clean_target');
        if (data) {
            setTargetData(JSON.parse(data));
        }
    }, [searchParams, router]);

    return (
        <section className="container content-section" style={{ paddingTop: '8rem' }}>
            <div className="glass-panel" style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '4rem 3rem',
                textAlign: 'center',
                borderTop: '4px solid #10b981',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)'
            }}>
                <div style={{
                    width: '5rem',
                    height: '5rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    color: '#10b981',
                    margin: '0 auto 2rem',
                    boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                }}>✓</div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>Payment Successful!</h1>
                
                <p style={{ color: '#d1d5db', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                    We have successfully received your request and payment. Our automated bots have been dispatched to scrub your personal data from the internet.
                </p>

                {targetData && (
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        marginBottom: '2rem',
                        textAlign: 'left',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{ fontSize: '1rem', color: '#10b981', marginBottom: '1rem' }}>Active Target:</h3>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div><strong>Name:</strong> <span style={{ color: '#fff' }}>{targetData.name}</span></div>
                            <div><strong>Email:</strong> <span style={{ color: '#fff' }}>{targetData.email}</span></div>
                            <div><strong>Phone:</strong> <span style={{ color: '#fff' }}>{targetData.phoneNumber}</span></div>
                        </div>
                    </div>
                )}

                <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '3rem' }}>
                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>⏳</span>
                    <span style={{ color: '#fcd34d', fontSize: '0.95rem' }}>This process typically takes 24 to 48 hours to fully complete.</span>
                </div>

                <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 3rem', background: '#10b981', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', borderRadius: '2rem' }}>
                    Go to Dashboard →
                </Link>
            </div>
        </section>
    );
}

export default function PrivacyCleanSuccess() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: '10rem', color: 'white' }}>Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </main>
    );
}
