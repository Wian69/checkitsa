import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { text, email } = await request.json()
        const db = getRequestContext().env.DB

        // 0. Permission Check
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized', message: 'Please sign in to analyze screenshots.' }, { status: 401 })
        }

        /*
        const userMeta = await db.prepare("SELECT tier FROM user_meta WHERE email = ?").bind(email).first()
        const tier = userMeta ? userMeta.tier : 'free'

        if (tier === 'free') {
            return NextResponse.json({
                error: 'Upgrade Required',
                message: 'Screenshot Analysis is a Pro feature.',
                risk_score: 0,
                flags: ['Please upgrade to analyze images.']
            }, { status: 402 })
        }
        */

        if (!text) {
            return NextResponse.json({ error: 'No text extracted' }, { status: 400 })
        }

        // --- ANALYZE TEXT ---
        const lowerText = text.toLowerCase()
        let score = 0
        let flags = []

        // 1. Keywords
        const dangerWords = ['winner', 'won', 'lottery', 'inheritance', 'bank account', 'password', 'pin', 'otp', 'urgent', 'suspended', 'click link']
        dangerWords.forEach(word => {
            if (lowerText.includes(word)) {
                score += 10
                flags.push(`Contains suspicious keyword: "${word}"`)
            }
        })

        // 2. Link Detection (Rough)
        if (lowerText.includes('http') || lowerText.includes('.com') || lowerText.includes('.ly')) {
            score += 10
            flags.push('Contains links or URLs.')
        }

        // 3. Phone Numbers
        if (text.match(/\+?\d{10,}/)) {
            flags.push('Contains phone numbers.')
        }

        // 4. Heuristics for "Screen Shot of Text"
        if (lowerText.includes('payment') && lowerText.includes('pending')) {
            score += 20
            flags.push('Payment Pending notification (Common Scam).')
        }

        if (score > 60) score = 100 // Cap for danger

        let verdict = 'Safe'
        if (score > 50) verdict = 'Suspicious'
        if (score > 80) verdict = 'Dangerous'

        return NextResponse.json({
            text_extracted: text.substring(0, 200) + '...', // Preview
            risk_score: score,
            verdict: verdict,
            flags: flags,
            message: verdict === 'Dangerous' ? '⛔ High Risk: This image contains scam triggers.' : 'Analysis Complete.'
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'System Error', message: error.message }, { status: 500 })
    }
}
