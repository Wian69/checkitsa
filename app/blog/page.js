"use client"
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export const runtime = 'edge'

const POSTS = [
    {
        slug: 'top-5-whatsapp-scams-south-africa-2025',
        title: 'The 5 Most Common WhatsApp Scams in South Africa (2025)',
        excerpt: 'From "Hey Mum" to hijackings, these are the top scams targeting South Africans on WhatsApp right now.',
        date: '2025-01-16',
        category: 'WhatsApp Scams'
    },
    {
        slug: 'how-to-spot-fake-heavy-machinery-seller',
        title: 'How to Spot a Fake Heavy Machinery Seller',
        excerpt: 'Buying a tractor or generator? Don\'t lose your deposit. Here are the 3 red flags of an equipment scam.',
        date: '2025-01-15',
        category: 'Buying Tips'
    },
    {
        slug: 'is-that-job-offer-real-3-red-flags',
        title: 'Is That Job Offer Real? 3 Red Flags to Watch For',
        excerpt: 'Scammers are preying on job seekers. Learn how to verify a recruiter before you pay any "training fees".',
        date: '2025-01-14',
        category: 'Job Scams'
    }
]

export default function BlogIndex() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <div className="mb-12">
                    <div className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        📚 Scam Prevention Guide
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6 font-outfit">
                        Latest Investigations
                    </h1>
                    <p className="text-xl text-gray-400 mb-12 font-light">
                        In-depth articles, guides, and warnings to help you stay ahead of the latest fraud trends in South Africa.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {POSTS.map(post => (
                        <Link href={`/blog/${post.slug}`} key={post.slug} className="group">
                            <article className="glass-panel" style={{ padding: '2rem', transition: 'all 0.3s ease' }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{post.category}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                    <span className="text-xs text-white/40 font-medium">{post.date}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                                    {post.title}
                                </h2>
                                <p className="text-white/60 leading-relaxed mb-6 font-light">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-blue-400 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                                    Read Article <span>→</span>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
