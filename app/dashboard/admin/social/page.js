"use client"
import Navbar from '@/components/Navbar'
import { useState } from 'react'

export default function SocialBotPage() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [lastQuery, setLastQuery] = useState('')

    const handleScan = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/social/find', { method: 'POST' })
            const data = await res.json()
            if (data.posts) {
                setPosts(data.posts)
                setLastQuery(data.query)
            }
        } catch (e) {
            console.error(e)
            alert('Scan failed')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        alert('Reply copied! Go paste it.')
    }

    return (
        <main className="min-h-screen pb-24">
            <Navbar />

            <div className="container pt-32 px-4 mx-auto max-w-5xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Social Sentinel 🤖</h1>
                        <p className="text-white/60">Find recent victims and help them (while driving traffic).</p>
                    </div>
                    <button
                        onClick={handleScan}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Scanning Internet...' : '🔴 Scan for Victims'}
                    </button>
                </div>

                {lastQuery && (
                    <div className="text-sm text-white/30 mb-6 font-mono">
                        Query: {lastQuery}
                    </div>
                )}

                <div className="grid gap-6">
                    {posts.length === 0 && !loading && (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                            <p className="text-white/40">No fresh potential victims found recently. Try again later.</p>
                        </div>
                    )}

                    {posts.map(post => (
                        <div key={post.id} className="glass-panel p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="inline-block px-2 py-1 bg-white/10 rounded text-xs text-white/70 mb-2">
                                        {post.source}
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        <a href={post.link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-indigo-400">
                                            {post.title} ↗
                                        </a>
                                    </h3>
                                    <p className="text-sm text-white/50 line-clamp-2">{post.snippet}</p>
                                </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                <div className="text-xs text-indigo-400 font-bold mb-2 uppercase tracking-wider">Suggested Reply</div>
                                <p className="text-white/90 mb-4 font-medium">{post.suggested_reply}</p>
                                <button
                                    onClick={() => copyToClipboard(post.suggested_reply)}
                                    className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 px-3 py-2 rounded border border-indigo-500/30 transition-all flex items-center gap-2"
                                >
                                    📋 Copy Reply
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
