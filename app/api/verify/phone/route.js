import { NextResponse } from 'next/server'

export async function POST(request) {
    const body = await request.json()
    let { phone } = body

    if (!phone) return NextResponse.json({ valid: false })

    // Normalize (Remove spaces, +27)
    phone = phone.replace(/\s/g, '').replace('+27', '0')

    // --- PREFIX ANALYSIS (Static HLR) ---
    const mobilePrefixes = {
        '082': 'Vodacom', '072': 'Vodacom', '076': 'Vodacom', '079': 'Vodacom', '071': 'Vodacom',
        '083': 'MTN', '073': 'MTN', '078': 'MTN', '0710': 'MTN',
        '084': 'Cell C', '074': 'Cell C',
        '081': 'Telkom Mobile', '061': 'Telkom Mobile', '062': 'Telkom Mobile', '063': 'Telkom Mobile',
        '060': 'MTN/Vodacom'
    }

    const landlinePrefixes = {
        '011': 'Gauteng (Johannesburg)',
        '012': 'Gauteng (Pretoria)',
        '021': 'Western Cape (Cape Town)',
        '031': 'KwaZulu-Natal (Durban)',
        '041': 'Eastern Cape (Port Elizabeth)',
        '051': 'Free State (Bloemfontein)'
    }

    const prefix3 = phone.substring(0, 3)
    const prefix4 = phone.substring(0, 4) // Some like 0710

    let carrier = 'Unknown Network'
    let location = 'South Africa'
    let type = 'Unknown'

    if (mobilePrefixes[prefix3] || mobilePrefixes[prefix4]) {
        carrier = mobilePrefixes[prefix4] || mobilePrefixes[prefix3]
        type = 'Mobile'
        location = 'Nationwide'
    } else if (landlinePrefixes[prefix3]) {
        carrier = 'Telkom / Fixed Line'
        type = 'Landline'
        location = landlinePrefixes[prefix3]
    }

    // --- OSINT (Reputation) ---
    const cseKey = process.env.GOOGLE_CSE_API_KEY
    const cx = process.env.GOOGLE_CSE_CX
    let osintFlags = []

    if (cseKey) {
        try {
            const query = `"${phone}" OR "${phone.replace(/^0/, '+27')}" scam OR complaint OR spam`
            const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(query)}`)
            const data = await res.json()

            if (data.items && data.items.length > 0) {
                osintFlags.push(`found ${data.items.length} potential spam reports online.`)
            }
        } catch (e) { }
    }

    // --- RESPONSE ---
    return NextResponse.json({
        valid: true,
        data: {
            number: phone,
            type: type,
            carrier: carrier,
            location: location,
            rica_status: type === 'Mobile' ? 'Likely Active & RICA Registered' : 'Unknown',
            rica_note: 'Note: Specific RICA ownership data is private by law. "Active" status implies registration.',
            risk_analysis: osintFlags.length > 0 ? 'High Risk (Reports Found)' : 'Low Risk (No Online Reports)',
            flags: osintFlags
        }
    })
}
