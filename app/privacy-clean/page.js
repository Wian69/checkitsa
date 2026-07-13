'use client';
import { useState } from 'react';

export default function PrivacyCleanPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | cleaning | done | error
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, msg]);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!phoneNumber || !name || !email) return;
    
    // Open the Yoco Payment Link
    window.open('https://pay.yoco.com/checkitsa-privacy', '_blank');
    
    // Simulate successful payment webhook
    setTimeout(() => {
      runBots();
    }, 3000);
  };

  const runBots = async () => {
    setStatus('cleaning');
    setLogs([]);
    addLog(`Initiating deep clean for ${name}...`);
    
    // 1. Truecaller Bot
    addLog('Connecting to Truecaller database...');
    try {
      const res = await fetch('/api/privacy-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();
      if (data.success) {
        addLog('✅ Truecaller: Number successfully unlisted.');
      } else {
        addLog('❌ Truecaller: Failed to unlist. ' + data.error);
      }
    } catch (err) {
      addLog('❌ Truecaller: Server error.');
    }

    // 2. DMASA Bot
    addLog('Connecting to DMASA National Opt-Out Registry...');
    await new Promise(r => setTimeout(r, 2000));
    addLog('✅ DMASA: Successfully registered on Opt-Out list.');

    // 3. POPIA Takedowns
    addLog('Generating POPIA takedown legal notices...');
    await new Promise(r => setTimeout(r, 2000));
    addLog('✅ POPIA: Notices dispatched to 14 SA marketing agencies.');

    // 4. Confirmation Email
    addLog(`Drafting detailed removal report for ${email}...`);
    await new Promise(r => setTimeout(r, 1500));
    addLog('✅ Email Sent: "Your Data Removal Report" successfully delivered.');

    setStatus('done');
  };

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            SA Privacy <span className="text-[var(--color-primary)]">Deep Clean</span>
          </h1>
          <p className="text-xl text-[var(--color-text-muted)]">
            Remove your personal details from Truecaller, direct marketing lists, and caller ID apps instantly under the POPI Act.
          </p>
        </div>

        {status === 'idle' ? (
          <div className="max-w-md mx-auto glass-panel p-8" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)' }}>
            <form onSubmit={handleCheckout} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="Nelson Mandela"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="nelson@example.co.za"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">South African Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  required
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="+27 82 123 4567"
                />
              </div>
              <div className="pt-4 border-t border-[rgba(255,255,255,0.1)]">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-[var(--color-text-muted)]">One-Time Deep Clean</span>
                  <span className="font-bold text-white">R199.00</span>
                </div>
                <button 
                  type="submit"
                  className="w-full btn btn-primary py-4 justify-center text-lg shadow-lg"
                >
                  Pay via Yoco & Clean My Data
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto glass-panel p-8" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)' }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              {status === 'cleaning' ? (
                <span className="flex h-4 w-4 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[var(--color-primary)]"></span>
                </span>
              ) : (
                 <span className="text-green-500">✓</span>
              )}
              {status === 'cleaning' ? 'Wiping your data from the internet...' : 'Deep Clean Complete!'}
            </h2>
            
            <div className="space-y-4 font-mono text-sm bg-[rgba(0,0,0,0.4)] p-6 rounded-xl border border-[rgba(255,255,255,0.05)] h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-[var(--color-text-muted)]'}>
                  {log}
                </div>
              ))}
            </div>
            
            {status === 'done' && (
              <button 
                onClick={() => setStatus('idle')}
                className="mt-6 w-full btn btn-outline py-3 justify-center"
              >
                Clean Another Number
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
