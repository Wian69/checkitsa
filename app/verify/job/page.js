"use client"
import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function JobVerifyPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [formData, setFormData] = useState({
        email: '',
        companyName: '',
        jobDescription: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        try {
            const res = await fetch('/api/verify/job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            setResult(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen pb-24 bg-[#0a0a0a]">
            <Navbar />

            <div className="container pt-32 px-4 mx-auto max-w-2xl">
                <div className="text-center mb-12">
                    <div className="inline-block px-3 py-1 mb-4 text-sm rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        🕵️‍♂️ Job Scam Validator
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Is this Job Real?
                    </h1>
                    <p className="text-white/60">
                        Paste the recruiter's details below to scan for hidden scam signals.
                    </p>
                </div>

                <div className="glass-panel p-6 md:p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Recruiter Email (Optional)</label>
                            <input
                                type="email"
                                placeholder="e.g. careers@gmail.com"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Company Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Awesome Reps Ltd"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Job Description / Ad Text</label>
                            <textarea
                                rows={4}
                                placeholder="Paste the job ad content here..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                value={formData.jobDescription}
                                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${loading
                                    ? 'bg-white/10 cursor-not-allowed text-white/40'
                                    : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 text-white'
                                }`}
                        >
                            {loading ? 'Analyzing Signals...' : 'Scan Job Offer'}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {result && (
                    <div className={`mt-8 p-6 rounded-2xl border ${result.isSafe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} animate-in fade-in slide-in-from-bottom-4`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`text-4xl p-3 rounded-xl ${result.isSafe ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {result.isSafe ? '✅' : '⚠️'}
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold ${result.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {result.verdict}
                                </h3>
                                <p className="text-white/60 text-sm">Targeted Scam Analysis</p>
                            </div>
                            <div className="ml-auto text-3xl font-bold text-white/20">
                                {result.riskScore}%
                            </div>
                        </div>

                        <div className="space-y-3">
                            {result.reasons.length > 0 ? (
                                result.reasons.map((reason, i) => (
                                    <div key={i} className="flex gap-3 text-white/80 text-sm p-3 bg-black/20 rounded-lg items-start">
                                        <span className="text-red-400 mt-0.5">✕</span>
                                        {reason}
                                    </div>
                                ))
                            ) : (
                                <p className="text-emerald-400/80 text-sm">We didn't find specific scam triggers, but always stay vigilant.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
