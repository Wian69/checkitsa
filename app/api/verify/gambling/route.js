import { NextResponse } from 'next/server'

export async function POST(request) {
    const { url } = await request.json()

    // Official licensed domains (Western Cape, Mpumalanga, etc.)
    // Data sourced from available licensed operator lists research
    const legalSites = [
        'lottostar.co.za', 'betway.co.za', 'hollywoodbets.net', 'supabets.co.za',
        'bet.co.za', 'playtsogo.co.za', 'scorebet.co.za', 'sunbet.co.za',
        'sportpesa.co.za', 'playabets.co.za', 'gbets.co.za', 'yesplay.bet',
        'worldofsport.co.za', 'interbet.co.za', 'tabgold.co.za', 'marshallsworldofsport.co.za',
        'betfred.co.za', '10bet.co.za', 'betshezi.co.za', 'tic-tac.co.za',
        'wsb.co.za', 'bettingworld.co.za', 'olimp.co.za', 'palacebet.co.za'
    ]

    // Normalize input
    let inputDomain = url.toLowerCase()
    // Remove protocol
    inputDomain = inputDomain.replace('https://', '').replace('http://', '')
    // Remove path
    inputDomain = inputDomain.split('/')[0]
    // Remove www.
    inputDomain = inputDomain.replace('www.', '')

    // Check for exact match or subdomain
    const isLegal = legalSites.some(site => inputDomain === site || inputDomain.endsWith('.' + site))

    return NextResponse.json({
        legal: isLegal,
        license: isLegal ? 'Verified (Provincial/National Gambling Board)' : 'Unverified / Potentially Illegal',
        details: isLegal
            ? { status: 'Licensed', operator: 'Authorized Operator', region: 'South Africa' }
            : { status: 'Warning', operator: 'Unknown / Offshore', region: 'Unregulated' }
    })
}
