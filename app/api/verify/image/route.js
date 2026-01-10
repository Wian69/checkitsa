import { NextResponse } from 'next/server'
import { createWorker } from 'tesseract.js'

// export const runtime = 'edge'

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('image')

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Perform OCR
        const worker = await createWorker('eng')
        const { data: { text } } = await worker.recognize(buffer)
        await worker.terminate()

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
        return NextResponse.json({ error: 'OCR Failed' }, { status: 500 })
    }
}
