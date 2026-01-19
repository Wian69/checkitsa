"use client"
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'

export default function LeadsPage() {
    return (
        <AuthGuard>
            <LeadsContent />
        </AuthGuard>
    )
}

function LeadsContent() {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [newLead, setNewLead] = useState({ business_name: '', email: '', source: 'Manual' })
    const [user, setUser] = useState(null)
    const [inviteProgress, setInviteProgress] = useState(null) // "Sending 1/5..."
    const [marketingProgress, setMarketingProgress] = useState(null)

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('checkitsa_user'))
        setUser(u)
        if (u && u.email === 'wiandurandt69@gmail.com') {
            fetchLeads(u.email)
        }
    }, [])

    const fetchLeads = (email) => {
        fetch(`/api/admin/leads?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                setLeads(data.leads || [])
                setLoading(false)
            })
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, lead: newLead })
            })
            if (res.ok) {
                alert('Lead added!')
                setNewLead({ business_name: '', email: '', source: 'Manual' })
                fetchLeads(user.email)
            } else {
                const d = await res.json()
                alert(d.error || 'Failed')
            }
        } catch (err) {
            alert('Error adding lead')
        }
    }

    const handleInvite = async (lead) => {
        if (!confirm(`Send invitation to ${lead.email}?`)) return

        try {
            const res = await fetch(`/api/admin/invite?test_email=${encodeURIComponent(lead.email)}&sender_email=${encodeURIComponent(user.email)}&business_name=${encodeURIComponent(lead.business_name)}`)
            const data = await res.json()

            if (data.success) {
                alert('Invite sent!')
                // Update status locally
                await fetch('/api/admin/leads', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, leadId: lead.id, status: 'Contacted', contacted: true })
                })
                fetchLeads(user.email)
            } else {
                alert('Failed: ' + (data.details || data.error))
            }
        } catch (e) {
            alert('Error sending invite')
        }
    }

    const handleInviteAll = async () => {
        const toInvite = leads.filter(l => l.status !== 'Contacted');
        if (toInvite.length === 0) return alert("All leads have already been contacted! 🎉");

        if (!confirm(`You are about to send ${toInvite.length} invitations. This might take a moment. Proceed?`)) return;

        let sentCount = 0;
        let failCount = 0;

        for (let i = 0; i < toInvite.length; i++) {
            const lead = toInvite[i];
            setInviteProgress(`Sending ${i + 1} of ${toInvite.length}...`);

            try {
                // 1. Send Email
                const res = await fetch(`/api/admin/invite?test_email=${encodeURIComponent(lead.email)}&sender_email=${encodeURIComponent(user.email)}&business_name=${encodeURIComponent(lead.business_name)}`);
                const data = await res.json();

                if (data.success) {
                    // 2. Update Status
                    await fetch('/api/admin/leads', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email, leadId: lead.id, status: 'Contacted', contacted: true })
                    });
                    sentCount++;
                } else {
                    console.error(`Failed to invite ${lead.email}:`, data.error);
                    failCount++;
                }
            } catch (err) {
                console.error(`Error inviting ${lead.email}`, err);
                failCount++;
            }

            // Small delay to be nice to the API
            await new Promise(r => setTimeout(r, 500));
        }

        setInviteProgress(null);
        alert(`Batch Complete!\n✅ Sent: ${sentCount}\n❌ Failed: ${failCount}`);
        fetchLeads(user.email);
    }

    const handleMarketingAll = async () => {
        // Filter for leads that HAVE been contacted but haven't bought yet (assumption: all 'Contacted' are eligible)
        const toMarket = leads.filter(l => l.status === 'Contacted');
        if (toMarket.length === 0) return alert("No contacted leads found to send marketing to.");

        if (!confirm(`Send "How CheckItSA Works" marketing email to ${toMarket.length} leads?`)) return;

        let sentCount = 0;
        let failCount = 0;

        for (let i = 0; i < toMarket.length; i++) {
            const lead = toMarket[i];
            setMarketingProgress(`Emailing ${i + 1} of ${toMarket.length}...`);

            try {
                // Send Marketing Email (type=marketing)
                const res = await fetch(`/api/admin/invite?type=marketing&test_email=${encodeURIComponent(lead.email)}&sender_email=${encodeURIComponent(user.email)}&business_name=${encodeURIComponent(lead.business_name)}`);
                const data = await res.json();

                if (data.success) {
                    sentCount++;
                } else {
                    console.error(`Failed to market to ${lead.email}:`, data.error);
                    failCount++;
                }
            } catch (err) {
                console.error(`Error marketing to ${lead.email}`, err);
                failCount++;
            }

            // Small delay
            await new Promise(r => setTimeout(r, 500));
        }

        setMarketingProgress(null);
        alert(`Marketing Campaign Complete!\n✅ Sent: ${sentCount}\n❌ Failed: ${failCount}`);
    }

    const sendTestPreview = async (type = 'invite') => {
        if (!user || !user.email) return
        if (!confirm(`Send a test ${type} email to yourself (${user.email})?`)) return

        try {
            const res = await fetch(`/api/admin/invite?type=${type}&test_email=${encodeURIComponent(user.email)}&sender_email=${encodeURIComponent(user.email)}&business_name=CheckItSA Demo`)
            const data = await res.json()
            if (data.success) {
                alert(`Test ${type} email sent to ${user.email}!`)
            } else {
                alert('Failed to send test: ' + (data.details || data.error))
            }
        } catch (e) {
            alert('Error sending test email')
        }
    }

    const seedLeads = async () => {
        if (!confirm("This will add demo/found leads. Continue?")) return
        const demoLeads = [
            // Plumbers
            { business_name: 'Plumbers SA', email: 'contact@plumbers.co.za', source: 'Web Search' },
            { business_name: 'Bettafix Plumbing', email: 'stephen@bettafixplumbing.co.za', source: 'Web Search' },
            { business_name: 'A Plumbing King', email: 'plumbingking.hh@gmail.com', source: 'Web Search' },
            { business_name: 'Mokopane Plumbing', email: 'jeffrey@kekana.com', source: 'Web Search' },
            { business_name: 'EC Plumbers', email: 'echitau@yahoo.com', source: 'Web Search' },
            { business_name: 'Bonjanala Emergence', email: 'faraimaketo7@gmail.com', source: 'Web Search' },
            // Hair & Beauty
            { business_name: 'Elite Hair & Beauty', email: 'info@elitehair.co.za', source: 'Web Search' },
            { business_name: 'Partners Hair Design', email: 'hello@partnershair.co.za', source: 'Web Search' },
            { business_name: 'Relaxatia Beauty', email: 'relaxatiasalon@gmail.com', source: 'Web Search' },
            // Real Estate
            { business_name: 'Property Inspector', email: 'propertyinspectorbloemfontein@gmail.com', source: 'Web Search' },
            { business_name: 'Global Estates', email: 'henda@globalestates.co.za', source: 'Web Search' },

            // Electricians
            { business_name: 'ECA SA', email: 'info@ecasa.co.za', source: 'Web Search' },
            { business_name: 'LJ Trading', email: 'jabulani.sibanda@ljtrading.co.za', source: 'Web Search' },
            { business_name: 'Lefhumo Electrical', email: 'manager@lefhumo.co.za', source: 'Web Search' },
            { business_name: 'Ampd Electrical', email: 'jono@ampdelectrical.co.za', source: 'Web Search' },
            { business_name: 'Halls Electrical', email: 'Hallselec@gmail.com', source: 'Web Search' },
            { business_name: 'Springs Electrical', email: 'springselectrical@yahoo.com', source: 'Web Search' },
            { business_name: 'Johans Electrical', email: 'Shirley@skytec.co.za', source: 'Web Search' },
            { business_name: 'Lights By William', email: 'William@lightzbywilliam.co.za', source: 'Web Search' },
            { business_name: 'Softech Electrical', email: 'Softechelectrical@gmail.com', source: 'Web Search' },
            { business_name: 'Valley Electrical', email: 'info@valleyelectrical.co.za', source: 'Web Search' },

            // Moving Companies
            { business_name: 'Mint Movers', email: 'housemoversmint@gmail.com', source: 'Web Search' },
            { business_name: 'Mr Cheap Transport', email: 'sales@mrcheaptransport.co.za', source: 'Web Search' },
            { business_name: 'Moving24', email: 'southafrica@moving24.com', source: 'Web Search' },

            // Catering
            { business_name: 'Caterfood SA', email: 'info@caterfoodsa.co.za', source: 'Web Search' },
            { business_name: 'Norma and Co', email: 'genevieve@norma-vilma.co.za', source: 'Web Search' },
            { business_name: 'The Real Food Co', email: 'info@real-food.co.za', source: 'Web Search' },
            { business_name: 'Fresh Creative', email: 'hello@freshfood.co.za', source: 'Web Search' },
            { business_name: 'Adeles Catering', email: 'adele.catering@gmail.com', source: 'Web Search' },

            // Solar Power (Nationwide)
            { business_name: 'Caltec Solar', email: 'duran@caltecsolar.africa', source: 'Web Search' },
            { business_name: 'Cape Electrician', email: '7814e39702z@gmail.com', source: 'Web Search' },
            { business_name: 'EnergyOn', email: 'info@EnergyOn.co.za', source: 'Web Search' },
            { business_name: 'EnergyVest', email: 'andrew@energyvest.co.za', source: 'Web Search' },
            { business_name: '360 Degs Projects', email: '360degsprojects@gmail.com', source: 'Web Search' },
            { business_name: 'El Rachun Holdings', email: 'prenetcomm@gmail.com', source: 'Web Search' },
            { business_name: 'Elcheck', email: 'info@elcheck.co.za', source: 'Web Search' },
            { business_name: 'Eleksol', email: 'kobusvanbiljon@gmail.com', source: 'Web Search' },
            { business_name: 'Emtech Solar', email: 'info@emtechsolar.co.za', source: 'Web Search' },
            { business_name: 'Energy Sense', email: 'yolandi@energysense.co.za', source: 'Web Search' },
            { business_name: 'Quantum Solar', email: 'info@quantum-solar.co.za', source: 'Web Search' },
            { business_name: 'Swartland Solar', email: 'swartlandsolar@gmail.com', source: 'Web Search' },
            { business_name: 'Solar Vision', email: 'jakes@solarvision.co.za', source: 'Web Search' },

            // Security Services
            { business_name: 'SSG Holdings', email: 'info@ssgsa.co.za', source: 'Web Search' },
            { business_name: 'Mezuzah Security', email: 'feelsafe@mezuzahsecurity.co.za', source: 'Web Search' },
            { business_name: 'Prime African', email: 'info@primeafrican.co.za', source: 'Web Search' },
            { business_name: 'Protea Coin', email: 'info@proteacoin.co.za', source: 'Web Search' },
            { business_name: 'ABC Security', email: 'morne@abcsecurity.co.za', source: 'Web Search' },
            { business_name: 'Afri Guard', email: 'wanda@afri-guard.co.za', source: 'Web Search' },
            { business_name: 'All 4 Security', email: 'shira@all4security.co.za', source: 'Web Search' },
            { business_name: 'Amabuso Security', email: 'admin@amabusosecurity.co.za', source: 'Web Search' },
            { business_name: 'ISEC Security', email: 'craig@isecsecurity.co.za', source: 'Web Search' },
            { business_name: 'Kallvest', email: 'salaries@kallvest.co.za', source: 'Web Search' },

            // Landscaping
            { business_name: 'Clean Cut Gardens', email: 'info@cleancut.co.za', source: 'Web Search' },
            { business_name: 'Grounded Landscaping', email: 'designs@groundedlandscaping.co.za', source: 'Web Search' },
            { business_name: 'The Friendly Plant', email: 'info@thefriendlyplant.co.za', source: 'Web Search' },
            { business_name: 'EcoScapes', email: 'admin@ecoscapes.co.za', source: 'Web Search' },
            { business_name: 'Rooted SA', email: 'rootedabr@gmail.com', source: 'Web Search' },
            { business_name: 'Jerrys Garden Service', email: 'jerrysgardenservice@gmail.com', source: 'Web Search' },
            { business_name: 'Vianathi Landscaping', email: 'ashley@vianathi.co.za', source: 'Web Search' },
            { business_name: 'Petro Landscaping', email: 'info@petrolandscaping.co.za', source: 'Web Search' },

            // Weddings & Events
            { business_name: 'Weddings In Africa', email: 'cindy.weddingsinafrica@gmail.com', source: 'Web Search' },
            { business_name: 'Orion Hotels Events', email: 'events@orionhotels.co.za', source: 'Web Search' },
            { business_name: 'Wedding Venue Co', email: 'contact@weddingvenue.co.za', source: 'Web Search' },

            // Guest Houses
            { business_name: 'Bloem Show Stay', email: 'info@bloemshow.co.za', source: 'Web Search' },
            { business_name: 'Melville Guest', email: 'info@melvilleguest.co.za', source: 'Web Search' },
            { business_name: 'Stellenbosch Lodges', email: 'info@stellenboschlodges.co.za', source: 'Web Search' },
            { business_name: 'Middelburg Karoo', email: 'info@midkaroo.co.za', source: 'Web Search' },
            { business_name: 'Orion Hotels', email: 'reservations@orionhotels.co.za', source: 'Web Search' },

            // Accountants
            { business_name: 'FinPro Accountants', email: 'info@finproaccountants.co.za', source: 'Web Search' },
            { business_name: 'LearnAndSave', email: 'INFO@LearnAndSave.co.za', source: 'Web Search' },
            { business_name: 'Leofin Rekenmeesters', email: 'mariaan@leofin.co.za', source: 'Web Search' },
            { business_name: 'Lethu Accounts', email: 'books@lethuaccounts.co.za', source: 'Web Search' },
            { business_name: 'PATC Accountants', email: 'gavin@patc.co.za', source: 'Web Search' },
            { business_name: 'Zeelie Professional', email: 'hello@zeeliepasa.co.za', source: 'Web Search' },
            { business_name: 'CFO360 Accountants', email: 'info@cfo360.co.za', source: 'Web Search' },
            { business_name: 'CY Financial', email: 'cyfinancialservices@gmail.com', source: 'Web Search' },
            { business_name: 'DAH Chartered', email: 'dalehair@dahca.co.za', source: 'Web Search' },
            { business_name: 'Ackim Consultants', email: 'ackim.consultants@gmail.com', source: 'Web Search' },

            // Cleaning Services
            { business_name: 'Advanced Cleaning', email: 'enquiries@advcs.co.za', source: 'Web Search' },
            { business_name: 'House of Cleaning', email: 'info@houseofcleaning.co.za', source: 'Web Search' },
            { business_name: 'Vulithuba Cleaning', email: 'vulithuba@telkomsa.net', source: 'Web Search' },
            { business_name: 'Nombie Trading', email: 'nombiecc@gmail.com', source: 'Web Search' },
            { business_name: 'Africa Cleaning JHB', email: 'orders@acssa.co.za', source: 'Web Search' },
            { business_name: 'Africa Cleaning CPT', email: 'salescpt@acssa.co.za', source: 'Web Search' },

            // Construction
            { business_name: 'Abil Services', email: 'ismail@abilservices.co.za', source: 'Web Search' },
            { business_name: 'ACP Ceilings', email: 'sally.raine@acponline.co.za', source: 'Web Search' },
            { business_name: 'Raubex Group', email: 'raubex@raubex.com', source: 'Web Search' },
            { business_name: 'Vumile Consulting', email: 'admin@vumile.co.za', source: 'Web Search' },
            { business_name: 'Concor Construction', email: 'info.construction@concor.co.za', source: 'Web Search' },
            { business_name: 'Amos Builders', email: 'amosmakulfabuilders@gmail.com', source: 'Web Search' },
            { business_name: 'Arti Homes', email: 'artihomes.sa@gmail.com', source: 'Web Search' },
            { business_name: 'Dukes Construction', email: 'info@dukesconstruction.co.za', source: 'Web Search' },
            { business_name: 'Eco-Pro Construction', email: 'manie@ecoprocon.co.za', source: 'Web Search' }
        ]

        for (const l of demoLeads) {
            await fetch('/api/admin/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, lead: l })
            })
        }
        alert("Leads seeded!")
        fetchLeads(user.email)
    }

    if (!user || user.email !== 'wiandurandt69@gmail.com') {
        return <div className="p-8 text-center">Unauthorized</div>
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem', paddingTop: '8rem' }} className="container">
            <Navbar />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>📢 Lead Acquisition</h1>
                <div>
                    {inviteProgress ? (
                        <span className="btn" style={{ background: '#3b82f6', color: 'white', marginRight: '1rem', cursor: 'wait' }}>
                            ⏳ {inviteProgress}
                        </span>
                    ) : (
                        <button onClick={handleInviteAll} className="btn btn-primary" style={{ marginRight: '1rem', background: '#ec4899', borderColor: '#be185d' }}>
                            🚀 Invite All
                        </button>
                    )}

                    {marketingProgress ? (
                        <span className="btn" style={{ background: '#059669', color: 'white', marginRight: '1rem', cursor: 'wait' }}>
                            ⏳ {marketingProgress}
                        </span>
                    ) : (
                        <button onClick={handleMarketingAll} className="btn btn-primary" style={{ marginRight: '1rem', background: '#10b981', borderColor: '#059669' }}>
                            📣 Send Marketing
                        </button>
                    )}

                    <button onClick={() => sendTestPreview('invite')} className="btn btn-outline" style={{ marginRight: '0.5rem' }}>📧 Test Invite</button>
                    <button onClick={() => sendTestPreview('marketing')} className="btn btn-outline" style={{ marginRight: '1rem' }}>📧 Test Marketing</button>
                    <button onClick={seedLeads} className="btn btn-outline">🌱 Import</button>
                </div>
            </div>

            {/* Add Lead Form */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add New Lead</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        placeholder="Business Name"
                        required
                        value={newLead.business_name}
                        onChange={e => setNewLead({ ...newLead, business_name: e.target.value })}
                        style={{ flex: 1, padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={newLead.email}
                        onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                        style={{ flex: 1, padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
                    />
                    <button type="submit" className="btn btn-primary">Add Lead</button>
                </form>
            </div>

            {/* Leads Table */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Business</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Source</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Last Contact</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{lead.business_name}</td>
                                <td style={{ padding: '1rem' }}>{lead.email}</td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#9ca3af' }}>{lead.source}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                                        background: lead.status === 'Contacted' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)',
                                        color: lead.status === 'Contacted' ? '#60a5fa' : 'white'
                                    }}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#9ca3af' }}>
                                    {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => handleInvite(lead)}
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                    >
                                        Invtiation 📧
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                        No leads found. Add one or click 'Import Demo Leads'.
                    </div>
                )}
            </div>
        </main>
    )
}
