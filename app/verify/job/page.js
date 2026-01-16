"use client"
import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function JobVerifyPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [formData, setFormData] = useState({
        jobUrl: '',
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
        <main className="min-h-screen pb-24">
            <Navbar />

            {/* Hero Section with Decoration */}
            <div className="relative pt-40 px-4">
                {/* Background Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-900/20 blur-[100px] -z-10 pointer-events-none rounded-full" />

                <div className="container mx-auto max-w-2xl text-center mb-12">
                    <div className="inline-block px-3 py-1 mb-4 text-sm rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                        🕵️‍♂️ Job Scam Validator
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                        Is this Job Real?
                    </h1>
                    <p className="text-lg text-white/60 mb-8 max-w-prose mx-auto">
                        Paste the recruiter's details or job link below to scan for hidden scam signals like free emails or fake domains.
                    </p>
                </div>

                <div className="container mx-auto max-w-2xl glass-panel p-6 md:p-8 border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl shadow-2xl shadow-indigo-500/10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Job Link / Application URL (Optional)</label>
                            <input
                                type="url"
                                placeholder="e.g. bit.ly/easy-job or https://careers.wixsite.com"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                                value={formData.jobUrl}
                                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Recruiter Email (If available)</label>
                            <input
                                type="email"
                                placeholder="e.g. careers@gmail.com"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Company Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Awesome Reps Ltd"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Job Description / Ad Text</label>
                            <textarea
                                rows={4}
                                placeholder="Paste the job ad content here..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all resize-none"
                                value={formData.jobDescription}
                                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-[0.98] ${loading
                                    ? 'bg-white/10 cursor-not-allowed text-white/40'
                                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-white'
                                }`}
                        >
                            {loading ? 'Analyzing Signals...' : 'Scan Job Offer'}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="container mx-auto max-w-2xl mt-8">
                        <div className={`p-6 rounded-2xl border ${result.isSafe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} animate-in fade-in slide-in-from-bottom-4`}>
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
                    </div>
                )}
            </div>
        </main>
    )
}
