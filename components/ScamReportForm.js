"use client"
import { useState } from 'react'

export default function ScamReportForm() {
    const [type, setType] = useState('WhatsApp')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null) // success, error
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '',
        scammer_details: '', description: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, type })
            })
            if (res.ok) {
                setStatus('success')
                setFormData({ name: '', email: '', phone: '', scammer_details: '', description: '' })
            } else {
                throw new Error('Failed to submit')
            }
        } catch (error) {
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    const types = ['WhatsApp', 'Social Media', 'SMS']

    return (
        <div className="glass-panel p-6 md:p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Report a Scam Incident</h2>
                <p className="text-gray-400">Help the community by reporting recent scam attempts.</p>
            </div>

            {/* Type Selector */}
            <div className="flex justify-center gap-4 mb-8 flex-wrap">
                {types.map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`px-6 py-3 rounded-full font-medium transition-all ${type === t
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        {t === 'WhatsApp' && '💬 '}
                        {t === 'Social Media' && '🌐 '}
                        {t === 'SMS' && '📱 '}
                        {t} Scam
                    </button>
                ))}
            </div>

            {status === 'success' ? (
                <div className="text-center py-12 animate-in fade-in zoom-in">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-400 mb-2">Report Submitted!</h3>
                    <p className="text-gray-400">Thank you for helping keep South Africa safe.</p>
                    <button onClick={() => setStatus(null)} className="mt-6 text-blue-400 hover:underline">Report another</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Details */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-blue-300 border-b border-gray-700 pb-2">Your Details (Private)</h3>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Your Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Your Email</label>
                            <input
                                required
                                type="email"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Incident Details */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-red-300 border-b border-gray-700 pb-2">Incident Details</h3>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                {type === 'Social Media' ? 'Profile Link / Name' : 'Scammer Number / Sender ID'}
                            </label>
                            <input
                                required
                                type="text"
                                placeholder={type === 'Social Media' ? 'e.g. facebook.com/profile123' : 'e.g. +27 12 345 6789'}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                                value={formData.scammer_details}
                                onChange={e => setFormData({ ...formData, scammer_details: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Description of Incident</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="What happened? What did they ask for?"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01]"
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                        {status === 'error' && <p className="text-red-400 text-center mt-4">Error submitting report. Please try again.</p>}
                    </div>
                </form>
            )}
        </div>
    )
}
