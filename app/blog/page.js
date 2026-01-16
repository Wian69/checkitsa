"use client"
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export const runtime = 'edge'

const POSTS = [
    {
        slug: 'top-5-whatsapp-scams-south-africa-2025',
        title: 'The 5 Most Common WhatsApp Scams in South Africa (2025)',
        excerpt: 'From "Hey Mum" to fake job offers, these are the top scams targeting South Africans on WhatsApp right now.',
        date: '2025-01-16',
        category: 'WhatsApp Scams'
    },
    {
        slug: 'how-to-spot-fake-heavy-machinery-seller',
        title: 'How to Spot a Fake Heavy Machinery Seller',
        excerpt: 'Buying a tractor or generator? Don\'t lose your deposit. Here are the 3 red flags of a fake equipment scam.',
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
        <main className="min-h-screen pb-24">
            <Navbar />

            <div className="container pt-48 px-4 mx-auto max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-block px-3 py-1 mb-4 text-sm rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                        📚 Scam Prevention Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 font-outfit">
                        Latest Investigations
                    </h1>
                    <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
                        In-depth articles, guides, and warnings to help you stay ahead of the latest fraud trends in South Africa.
                    </p>
                </div>

                <div className="grid gap-8">
                    {POSTS.map(post => (
                        <Link href={`/blog/${post.slug}`} key={post.slug} className="group">
                            <article className="glass-panel p-8 transition-all hover:bg-white/10 hover:border-indigo-500/30">
                                <div className="flex items-center gap-2 mb-4 text-sm">
                                    <span className="text-indigo-400 font-bold uppercase tracking-wider">{post.category}</span>
                                    <span className="text-white/20">•</span>
                                    <span className="text-white/40">{post.date}</span>
                                </div>
                                <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-white/60 leading-relaxed mb-4">
                                    {post.excerpt}
                                </p>
                                <span className="text-indigo-400 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Read Article <span>→</span>
                                </span>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
