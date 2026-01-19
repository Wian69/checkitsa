"use client"
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'

function LeadsPage() {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [newLead, setNewLead] = useState({ business_name: '', email: '', source: 'Manual' })
    const [user, setUser] = useState(null)

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

    const sendTestPreview = async () => {
        if (!user || !user.email) return
        if (!confirm(`Send a test invitation email to yourself (${user.email})?`)) return

        try {
            const res = await fetch(`/api/admin/invite?test_email=${encodeURIComponent(user.email)}&sender_email=${encodeURIComponent(user.email)}&business_name=CheckItSA Demo`)
            const data = await res.json()
            if (data.success) {
                alert(`Test email sent to ${user.email}! Check your inbox (and spam folder).`)
            } else {
                alert('Failed to send test: ' + (data.details || data.error))
            }
        } catch (e) {
            alert('Error sending test email')
        }
    }

    const seedLeads = async () => {
        if (!confirm("This will add 5 demo leads. Continue?")) return
        const demoLeads = [
            { business_name: 'PlumbingCenturion', email: 'info@plumbingcenturion.co.za', source: 'Web Search' },
            { business_name: 'Centurion Plumbers', email: 'info@centurionplumbers.africa', source: 'Web Search' },
            { business_name: 'Cape Town Electricians', email: 'heath@electriciancapetown.co.za', source: 'Web Search' },
            { business_name: 'Richie Rich Elec', email: 'richierichelec@gmail.com', source: 'Web Search' },
            { business_name: 'Abcord Electrical', email: 'abcord@mweb.co.za', source: 'Web Search' }
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
                    <button onClick={sendTestPreview} className="btn btn-outline" style={{ marginRight: '1rem' }}>📧 Send Test Preview</button>
                    <button onClick={seedLeads} className="btn btn-outline">🌱 Import Demo Leads</button>
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

export default AuthGuard(LeadsPage)
