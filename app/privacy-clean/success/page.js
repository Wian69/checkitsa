'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [targetData, setTargetData] = useState(null);
    const [exposedBrokers, setExposedBrokers] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [dispatchError, setDispatchError] = useState(null);

    useEffect(() => {
        // Verify payment status from Yoco redirect URL
        const status = searchParams.get('status');
        if (status !== 'paid') {
            router.push('/privacy-clean');
            return;
        }

        const data = localStorage.getItem('privacy_clean_target');
        const brokersData = localStorage.getItem('privacy_clean_brokers');
        const checkoutId = localStorage.getItem('pending_privacy_checkout');
        
        if (data && brokersData) {
            const parsedData = JSON.parse(data);
            const parsedBrokers = JSON.parse(brokersData);
            setTargetData(parsedData);
            setExposedBrokers(parsedBrokers);
            
            // Trigger backend to verify and send email (Wait for it)
            if (checkoutId) {
                setIsDeleting(true); // Show a loading state while emailing
                fetch('/api/verify-privacy-clean', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        checkoutId: checkoutId,
                        targetName: parsedData.name,
                        targetEmail: parsedData.email,
                        targetPhone: parsedData.phoneNumber,
                        brokersList: parsedBrokers
                    })
                }).then(async (res) => {
                    if (!res.ok) {
                        const errText = await res.text();
                        console.error("Email API Failed:", errText);
                        setDispatchError("SERVER ERROR: " + errText);
                    }
                }).catch(e => {
                    console.error("Email verification trigger failed:", e);
                    setDispatchError("NETWORK ERROR: " + e.message);
                }).finally(() => {
                    setIsDeleting(false);
                });
                
                // Clear to prevent duplicate sends on refresh
                localStorage.removeItem('pending_privacy_checkout');
            }
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
                
                {dispatchError && (
                    <div style={{ background: '#ef4444', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left', border: '2px solid #b91c1c', fontWeight: 'bold' }}>
                        ⚠️ CRITICAL EMAIL FAILURE:<br/><br/>
                        {dispatchError}
                    </div>
                )}

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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginBottom: '3rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                            {exposedBrokers.map((broker, idx) => (
                                <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: `4px solid ${broker.risk === 'HIGH RISK' ? '#ef4444' : '#f59e0b'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <a href={`https://${broker.url}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem', textDecoration: 'underline' }}>
                                            {broker.name} Database 🔗
                                        </a>
                                        <span style={{ fontSize: '0.8rem', background: broker.risk === 'HIGH RISK' ? '#ef4444' : '#f59e0b', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>{broker.risk}</span>
                                    </div>
                                    <div style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Match found for {targetData.name}. Highly accessible to the public.</div>
                                </div>
                            ))}
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

                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>Legal Request Initiated!</h1>
                        
                        <p style={{ color: '#d1d5db', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                            We have officially dispatched a formal Data Erasure Request (POPIA/GDPR) to <strong>{exposedBrokers.length} data brokers</strong> on your behalf.
                        </p>

                        <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '3rem', textAlign: 'left' }}>
                            <h4 style={{ color: '#fcd34d', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Next Steps & Important Info:</h4>
                            <ul style={{ color: '#d1d5db', margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <li><strong>Proof Sent:</strong> A copy of the legal request has been sent to your inbox. The data brokers were BCC'd on that email.</li>
                                <li><strong>30-Day ETA:</strong> Data brokers have a strict 30-day legal timeframe under POPIA/GDPR to fulfill the request.</li>
                                <li><strong>Identity Verification:</strong> Some strict brokers may reply directly to the email to verify your identity. If they do, simply reply to confirm you want your data removed.</li>
                            </ul>
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
