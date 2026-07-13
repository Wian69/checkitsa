'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            const yocoStatus = searchParams.get('status');
            if (yocoStatus !== 'paid') {
                router.push('/subscription');
                return;
            }

            const checkoutId = localStorage.getItem('pending_subscription_checkout');
            if (!checkoutId) {
                setStatus('error');
                setErrorMessage('No pending checkout found. If you paid, please contact support.');
                return;
            }

            try {
                const res = await fetch('/api/verify-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checkoutId })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Verification failed');
                }

                // Update local storage with the new user tier
                localStorage.setItem('checkitsa_user', JSON.stringify(data.user));
                localStorage.setItem('checkitsa_tier', data.user.tier);
                
                // Clear the pending checkout
                localStorage.removeItem('pending_subscription_checkout');

                setStatus('success');
            } catch (err) {
                console.error("Verification Error:", err);
                setStatus('error');
                setErrorMessage(err.message);
            }
        };

        verifyPayment();
    }, [searchParams, router]);

    return (
        <section className="container content-section" style={{ paddingTop: '8rem' }}>
            <div className="glass-panel" style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '4rem 3rem',
                textAlign: 'center',
                borderTop: status === 'success' ? '4px solid #10b981' : (status === 'error' ? '4px solid #ef4444' : '4px solid #6366f1'),
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)'
            }}>
                
                {status === 'verifying' && (
                    <>
                        <div style={{
                            width: '5rem', height: '5rem', margin: '0 auto 2rem',
                            border: '4px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1',
                            borderRadius: '50%', animation: 'spin 1s linear infinite'
                        }} />
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Verifying Payment...</h1>
                        <p style={{ color: '#9ca3af' }}>Please do not close this window while we securely upgrade your account.</p>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '5rem', height: '5rem', background: 'rgba(16, 185, 129, 0.2)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', color: '#10b981', margin: '0 auto 2rem',
                            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                        }}>✓</div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>Upgrade Successful!</h1>
                        <p style={{ color: '#d1d5db', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                            Your account has been successfully upgraded. Thank you for choosing CheckIt SA!
                        </p>
                        <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '2rem' }}>
                            Go to Dashboard →
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '5rem', height: '5rem', background: 'rgba(239, 68, 68, 0.2)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', color: '#ef4444', margin: '0 auto 2rem'
                        }}>!</div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Verification Failed</h1>
                        <p style={{ color: '#ef4444', marginBottom: '2rem' }}>{errorMessage}</p>
                        <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            If the money left your account, please contact support and we will manually activate your subscription.
                        </p>
                        <Link href="/subscription" className="btn btn-outline" style={{ padding: '1rem 3rem', borderRadius: '2rem' }}>
                            ← Return to Packages
                        </Link>
                    </>
                )}

            </div>
        </section>
    );
}

export default function SubscriptionSuccess() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />
            <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: '10rem', color: 'white' }}>Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </main>
    );
}
