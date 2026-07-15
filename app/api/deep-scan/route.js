import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import dataBrokers from '@/app/lib/dataBrokers.json'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, phone, name } = await req.json()
        
        if (!email && !phone) {
            return NextResponse.json({ matches: [] })
        }

        const db = getRequestContext().env.DB;
        
        // 1. Check if they have scanned before
        const cacheQuery = await db.prepare('SELECT * FROM scan_results WHERE email = ?').bind(email).first();

        if (cacheQuery) {
            const lastScannedAt = new Date(cacheQuery.last_scanned_at);
            const now = new Date();
            const daysSinceLastScan = (now - lastScannedAt) / (1000 * 60 * 60 * 24);
            
            let cachedMatches = JSON.parse(cacheQuery.matches_json);

            // 2. RATE LIMIT LOCK: If < 30 days, return exact cache and lock them out
            if (daysSinceLastScan < 30) {
                return NextResponse.json({ 
                    matches: cachedMatches, 
                    locked: true,
                    daysLeft: Math.ceil(30 - daysSinceLastScan)
                });
            }

            // 3. 30 DAYS PASSED: We check if they paid for the service
            const paidQuery = await db.prepare('SELECT id FROM dispatch_logs WHERE target_email = ?').bind(email).first();

            if (paidQuery) {
                // They paid! Simulate successful deletion by removing 60-80% of the brokers
                const brokersToKeep = Math.max(0, Math.floor(cachedMatches.length * (0.2 + Math.random() * 0.2)));
                
                // Shuffle and slice to keep a random subset
                cachedMatches.sort(() => 0.5 - Math.random());
                cachedMatches = cachedMatches.slice(0, brokersToKeep);
            } else {
                // They didn't pay. Increase urgency by keeping it the same or adding 1-2 new random ones
                // For simplicity, we just keep it exactly the same so it's a consistent threat
            }

            // Update their cache with the new results and reset the 30-day clock
            await db.prepare('UPDATE scan_results SET matches_json = ?, last_scanned_at = CURRENT_TIMESTAMP WHERE email = ?')
                .bind(JSON.stringify(cachedMatches), email)
                .run();

            return NextResponse.json({ matches: cachedMatches });
        }

        // 4. FIRST SCAN: Run the live scraper
        const queryParts = []
        if (email) queryParts.push(`"${email}"`)
        if (phone) queryParts.push(`"${phone}"`)
        const query = queryParts.join(' OR ')

        const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        })
        
        let matches = [];
        
        if (res.ok) {
            const html = await res.text()
            const domains = []
            const regex = /<a class="result__url" href="[^"]+">\s*([^<]+)\s*<\/a>/g
            let match
            
            while ((match = regex.exec(html)) !== null) {
                let domainStr = match[1].trim().replace(/<\/?b>/g, '')
                const cleanDomain = domainStr.split('/')[0].toLowerCase()
                const ignoreList = ['duckduckgo.com', 'google.com', 'checkitsa.co.za', 'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com']
                if (cleanDomain && !ignoreList.some(ignore => cleanDomain.includes(ignore))) {
                    domains.push(cleanDomain)
                }
            }
            
            const uniqueDomains = [...new Set(domains)]
            matches = uniqueDomains.map((domain, index) => {
                const baseName = domain.replace(/^www\./i, '').split('.')[0];
                return {
                    name: baseName.charAt(0).toUpperCase() + baseName.slice(1),
                    url: domain,
                    risk: index < 3 ? 'HIGH RISK' : 'MEDIUM RISK'
                };
            });
        }

        // HYBRID FALLBACK ALGORITHM (If duckduckgo fails or returns 0)
        if (matches.length === 0) {
            const seedString = (email || '') + (phone || '') + (name || '')
            let seed = 0
            for (let i = 0; i < seedString.length; i++) {
                seed = (seed << 5) - seed + seedString.charCodeAt(i)
                seed |= 0
            }
            
            const numBrokers = 18 + Math.abs(seed % 25)
            let shuffledBrokers = [...dataBrokers]
            for (let i = shuffledBrokers.length - 1; i > 0; i--) {
                const j = Math.abs((seed * i) % (i + 1))
                ;[shuffledBrokers[i], shuffledBrokers[j]] = [shuffledBrokers[j], shuffledBrokers[i]]
            }
            
            matches = shuffledBrokers.slice(0, numBrokers).map((broker, index) => ({
                name: broker.name,
                url: broker.name.toLowerCase().replace(/\s+/g, '') + '.co.za',
                risk: index < 12 ? 'HIGH RISK' : 'MEDIUM RISK'
            }))
        }

        // SAVE FIRST SCAN TO DATABASE
        await db.prepare('INSERT INTO scan_results (email, matches_json) VALUES (?, ?)')
            .bind(email, JSON.stringify(matches))
            .run();

        return NextResponse.json({ matches })
    } catch (e) {
        console.error('Deep Scan Error:', e)
        return NextResponse.json({ matches: [] }, { status: 500 })
    }
}
