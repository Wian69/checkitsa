import { NextResponse } from 'next/server'

export const runtime = 'edge'


export async function POST(request) {
    const body = await request.json()
    let { phone } = body

    if (!phone) return NextResponse.json({ valid: false })

    // Normalize (Remove spaces, +27)
    phone = phone.replace(/\s/g, '').replace('+27', '0')

    // --- PREFIX ANALYSIS (Static HLR) ---
    // --- PREFIX ANALYSIS (Static HLR) ---
    // Expanded for better Business detections
    const mobilePrefixes = {
        '082': 'Vodacom', '072': 'Vodacom', '076': 'Vodacom', '079': 'Vodacom', '071': 'Vodacom',
        '083': 'MTN', '073': 'MTN', '078': 'MTN',
        '084': 'Cell C', '074': 'Cell C',
        '081': 'Telkom Mobile', '061': 'Telkom Mobile', '062': 'Telkom Mobile', '063': 'Telkom Mobile',
        '060': 'MTN/Vodacom', '064': 'MTN/Vodacom', '065': 'Cell C/Telkom', '066': 'Vodacom', '067': 'Telkom', '068': 'Telkom', '069': 'Telkom'
    }

    const landlinePrefixes = {
        '010': 'Gauteng (JHB)', '011': 'Gauteng (JHB)', '012': 'Gauteng (PTA)', '013': 'Mpumalanga', '014': 'North West',
        '015': 'Limpopo', '016': 'Gauteng (Vaal)', '017': 'Mpumalanga', '018': 'North West',
        '021': 'Western Cape (CPT)', '022': 'Western Cape (West Coast)', '023': 'Western Cape (Karoo)', '024': 'Western Cape', '027': 'Northern Cape (Namaqualand)', '028': 'Western Cape (South Coast)',
        '031': 'KZN (Durban)', '032': 'KZN (North Coast)', '033': 'KZN (PMB)', '034': 'KZN (Newcastle)', '035': 'KZN (Zululand)', '036': 'KZN (Drakensberg)', '039': 'Eastern Cape / KZN',
        '041': 'Eastern Cape (PE)', '042': 'Eastern Cape (Uitenhage)', '043': 'Eastern Cape (East London)', '044': 'Western Cape (Garden Route)', '047': 'Eastern Cape (Mthatha)',
        '051': 'Free State (BFN)', '053': 'Northern Cape (Kimberley)', '054': 'Northern Cape (Upington)', '057': 'Free State (Welkom)', '058': 'Free State (Bethlehem)'
    }

    const businessPrefixes = {
        '080': 'Toll-Free (Business)',
        '086': 'Sharecall / Maxicall (Business)',
        '087': 'VoIP (Business / Call Center)',
        '085': 'Cellular (Business/M2M)'
    }

    const prefix3 = phone.substring(0, 3)
    const prefix4 = phone.substring(0, 4)

    let carrier = 'Unknown Network'
    let location = 'South Africa'
    let type = 'Unknown'

    if (mobilePrefixes[prefix3] || mobilePrefixes[prefix4]) {
        carrier = mobilePrefixes[prefix4] || mobilePrefixes[prefix3]
        type = 'Mobile'
        location = 'Nationwide'
    } else if (businessPrefixes[prefix3] || businessPrefixes[prefix4]) {
        // Business Check
        carrier = businessPrefixes[prefix3] || 'Business Network'
        type = 'Business / VoIP Line'
        location = 'Nationwide (Virtual)'
    } else if (landlinePrefixes[prefix3]) {
        carrier = 'Telkom / Fixed Line'
        type = 'Landline (Business/Home)'
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
