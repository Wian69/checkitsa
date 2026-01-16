"use client"
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export const runtime = 'edge'

const ARTICLES = {
    'top-5-whatsapp-scams-south-africa-2025': {
        title: 'The 5 Most Common WhatsApp Scams in South Africa (2025)',
        date: '2025-01-16',
        category: 'WhatsApp Scams',
        content: `
            <p class="mb-6 opacity-80">WhatsApp is used by almost everyone in South Africa, which makes it the #1 playground for scammers. Here are the top 5 scams you need to watch out for right now.</p>
            
            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">1. The "Hey Mum/Dad" Scam</h3>
            <p class="mb-6 opacity-80">You get a message from an unknown number saying: "Hey Mum, I lost my phone. This is my new number." They will chat for a bit, then ask for money for "rent" or "airtime" because their banking app isn't set up yet.</p>
            <div class="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl mb-10 text-red-200">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xl">⚠️</span>
                    <strong class="font-bold text-red-400 uppercase tracking-wider text-xs">Red Flag</strong>
                </div>
                <p class="text-sm">Any family member asking for money from a new number. Call their OLD number to verify immediately.</p>
            </div>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">2. The "Verification Code" Hijack</h3>
            <p class="mb-6 opacity-80">A friend (whose account was hacked) asks you to send them a 6-digit code that was sent to your SMS by mistake. If you send it, the scammer uses it to hijack YOUR WhatsApp account.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">3. The Bol.com / Takealot Job Scam</h3>
            <p class="mb-6 opacity-80">You get a message offering a part-time job "optimizing data" or "rating products" for platforms like Bol.com or Takealot. They promise R2000/day but eventually ask you to deposit money to "unlock" higher tiers.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">4. The Fake Proof of Payment (EFT)</h3>
            <p class="mb-6 opacity-80">If you sell on Facebook Marketplace, a buyer will send a PDF proof of payment and send an Uber to collect the item. The PDF is fake. The money never clears.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">5. The "Customs Fee" SMS</h3>
            <p class="mb-10 opacity-80">You get an SMS (often with a link like 'sapost-fees.com') saying a package is held at customs. It asks for a small fee (R40). If you pay, they steal your card details.</p>

            <div class="mt-16 p-8 bg-blue-600/10 rounded-3xl border border-blue-500/20 text-center">
                <h4 class="text-xl font-bold text-blue-400 mb-3 font-outfit">Not sure about a number?</h4>
                <p class="mb-6 text-white/60 font-light">Paste the phone number into CheckItSA to see if others have reported it before you reply.</p>
                <a href="/" class="btn btn-primary inline-block px-8">Verify a Number Now</a>
            </div>
        `
    },
    'how-to-spot-fake-heavy-machinery-seller': {
        title: 'How to Spot a Fake Heavy Machinery Seller',
        date: '2025-01-15',
        category: 'Buying Tips',
        content: `
            <p class="mb-6 opacity-80">Farmers and construction business owners are losing millions to fake equipment sellers. Scammers set up professional-looking websites selling tractors, excavators, and generators at "auction prices".</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">1. The Price is Too Good</h3>
            <p class="mb-6 opacity-80">If a 2020 Bell Dumper is listed for R150,000 when the market value is R800,000, it is 100% a scam. They claim it's a "bank repo" or "liquidation sale" to explain the low price.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">2. They Cannot Show You the Machine</h3>
            <p class="mb-6 opacity-80">They will have an excuse for why you can't view it: "It's in a secure yard in Upington," or "It's already packaged for export." They rely on photos stolen from legitimate overseas sites.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">3. The Website is Brand New</h3>
            <p class="mb-10 opacity-80 text-white/80">Use our <strong>Web Scanner</strong> to check their domain age. Most scam sites are less than 3 months old, even if they claim to have "20 years experience".</p>

            <div class="mt-16 p-8 bg-blue-600/10 rounded-3xl border border-blue-500/20 text-center">
                <h4 class="text-xl font-bold text-blue-400 mb-3 font-outfit">Check the Website Before You Pay</h4>
                <p class="mb-6 text-white/60 font-light">Don't pay a deposit until you check the domain age and digital footprint on CheckItSA.</p>
                <a href="/" class="btn btn-primary inline-block px-8">Scan Website</a>
            </div>
        `
    },
    'is-that-job-offer-real-3-red-flags': {
        title: 'Is That Job Offer Real? 3 Red Flags to Watch For',
        date: '2025-01-14',
        category: 'Job Scams',
        content: `
            <p class="mb-6 opacity-80">With unemployment high, scammers are preying on desperate job seekers. Here is how to tell if a recruiter is legitimate.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">1. They Ask for Money upfront</h3>
            <p class="mb-6 opacity-80">This is the biggest rule: <strong>Legitimate jobs NEVER ask you to pay.</strong> Not for "uniforms," not for "background checks," and not for "admin fees." If they ask for money, it is a scam.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">2. The Email Address is Free</h3>
            <p class="mb-6 opacity-80 text-white/80">Real recruiters from big companies (like Shoprite or Sasol) use corporate emails (e.g. <code>careers@shoprite.co.za</code>). They do NOT use Gmail, Yahoo, or Outlook addresses.</p>

            <h3 class="text-2xl font-bold text-white mb-4 mt-10 font-outfit">3. The Interview is ONLY on WhatsApp</h3>
            <p class="mb-10 opacity-80">While some initial chats happen on WhatsApp, a text-only interview followed immediately by a "Job Offer" is highly suspicious. Real companies will call you or do a video interview.</p>

            <div class="mt-16 p-8 bg-blue-600/10 rounded-3xl border border-blue-500/20 text-center">
                <h4 class="text-xl font-bold text-blue-400 mb-3 font-outfit">Verify the Recruiter</h4>
                <p class="mb-6 text-white/60 font-light">Search the recruiter's email or phone number on CheckItSA to see if others have reported them.</p>
                <a href="/" class="btn btn-primary inline-block px-8">Verify Details</a>
            </div>
        `
    }
}

export default function BlogPost() {
    const params = useParams()
    const post = ARTICLES[params.slug]

    if (!post) {
        return (
            <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
                <Navbar />
                <div className="container" style={{ paddingTop: '10rem', textAlign: 'center' }}>
                    <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
                    <Link href="/blog" className="btn btn-primary">Return to Blog</Link>
                </div>
            </main>
        )
    }

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '10rem', maxWidth: '800px' }}>
                <Link href="/blog" className="text-gray-400 hover:text-white mb-10 inline-flex items-center gap-2 transition-colors text-sm font-medium">
                    <span>←</span> BACK TO ARTICLES
                </Link>

                <header className="mb-16">
                    <div className="inline-block px-2 py-0.5 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        {post.category}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 font-outfit leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        {post.title}
                    </h1>
                    <div className="text-gray-500 font-light text-sm uppercase tracking-widest flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-white/10"></span>
                        Published on {post.date}
                    </div>
                </header>

                <div
                    className="glass-panel"
                    style={{ padding: '3rem 2rem', fontSize: '1.125rem', lineHeight: '1.8' }}
                >
                    <div
                        className="text-white/80 font-light"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </div>

                <div className="mt-12 text-center">
                    <Link href="/blog" className="text-gray-500 hover:text-white transition-all text-sm uppercase tracking-widest font-bold">
                        Browse More Investigations
                    </Link>
                </div>
            </div>
        </main>
    )
}
