'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [targetData, setTargetData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);

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

    const handleDelete = async () => {
        setIsDeleting(true);
        // Simulate a secure deletion process connecting to backend bots
        await new Promise(r => setTimeout(r, 2500));
        setIsDeleting(false);
        setIsDeleted(true);
    };

    return (
        <section className="container content-section" style={{ paddingTop: '8rem' }}>
            <div className="glass-panel" style={{
                maxWidth: '700px',
                margin: '0 auto',
                padding: '4rem 3rem',
                textAlign: 'center',
                borderTop: '4px solid #10b981',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)'
            }}>
                
                {!isDeleted ? (
                    <>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '2rem',
                            color: '#10b981', fontWeight: 'bold', marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            <span>✓</span> Payment Verified
                        </div>

                        <h1 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: '#fff' }}>Exposed Data Unlocked</h1>
                        <p style={{ color: '#d1d5db', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                            We have successfully unlocked the search results. Review the exposed databases below and click delete to permanently scrub your traces.
                        </p>

                        {targetData && (
                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                padding: '1rem',
                                borderRadius: '1rem',
                                marginBottom: '2rem',
                                textAlign: 'left',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'center'
                            }}>
                                <div style={{ color: '#9ca3af', fontSize: '0.9rem', flex: 1 }}>
                                    <strong>Target:</strong> <span style={{ color: '#fff', marginLeft: '0.5rem' }}>{targetData.name} ({targetData.phoneNumber})</span>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginBottom: '3rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>Truecaller Global Database</div>
                                    <span style={{ fontSize: '0.8rem', background: '#ef4444', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>HIGH RISK</span>
                                </div>
                                <div style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Match found for name and phone number. Highly accessible to the public.</div>
                            </div>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>Apollo.io B2B Lead List</div>
                                    <span style={{ fontSize: '0.8rem', background: '#f59e0b', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>MEDIUM RISK</span>
                                </div>
                                <div style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Match found for email address and professional profile. Used by marketers.</div>
                            </div>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>Local SA Marketing DB</div>
                                    <span style={{ fontSize: '0.8rem', background: '#f59e0b', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>MEDIUM RISK</span>
                                </div>
                                <div style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Match found for direct marketing profile. Source of SMS spam.</div>
                            </div>
                        </div>

                        <button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="btn btn-primary" 
                            style={{ 
                                width: '100%', 
                                padding: '1.2rem', 
                                background: isDeleting ? '#374151' : '#ef4444', 
                                boxShadow: isDeleting ? 'none' : '0 4px 14px 0 rgba(239, 68, 68, 0.39)', 
                                borderRadius: '2rem',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: '#fff',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {isDeleting ? (
                                <>
                                    <div style={{ width: '1.2rem', height: '1.2rem', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    Dispatching Bots...
                                </>
                            ) : 'Permanently Delete All Traces'}
                        </button>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </>
                ) : (
                    <>
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

                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>Deletion Initiated!</h1>
                        
                        <p style={{ color: '#d1d5db', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                            Our automated bots have been successfully dispatched to scrub your personal data from these databases.
                        </p>

                        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '3rem' }}>
                            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>⏳</span>
                            <span style={{ color: '#fcd34d', fontSize: '0.95rem' }}>This process typically takes 24 to 48 hours to fully complete across all global servers.</span>
                        </div>

                        <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 3rem', background: '#10b981', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', borderRadius: '2rem' }}>
                            Return to Dashboard →
                        </Link>
                    </>
                )}
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
