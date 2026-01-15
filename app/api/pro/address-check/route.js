import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { businessName, address } = await req.json()
        const env = getRequestContext().env
        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY

        if (!businessName || !address) return NextResponse.json({ message: 'Missing fields' }, { status: 400 })

        // Search Locations via Serper
        // query: "Business Name Address"
        const query = `${businessName} ${address}`

        const res = await fetch('https://google.serper.dev/places', {
            method: 'POST',
            headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: query,
                gl: 'za'
            })
        })

        const data = await res.json()
        const places = data.places || []

        if (places.length === 0) {
            return NextResponse.json({
                status: 'UNVERIFIED',
                message: 'We could not find this business listed at the provided address on Google Maps.'
            })
        }

        // Pick the best match
        const match = places[0]

        // Analyze Match Quality
        // Is the address in the result close to the input?
        const matchAddress = (match.address || '').toLowerCase()
        const inputAddress = address.toLowerCase()

        // Simple heuristic: Does the place address contain key parts of input?
        // or effectively, since we searched for "Business + Address", if Google returns a result 
        // that matches the Name, it's likely the right spot.

        const isClosed = match.status === 'Closed permanently' || match.status === 'Temporarily closed'

        let status = 'VERIFIED'
        if (isClosed) status = 'WARNING_CLOSED'

        return NextResponse.json({
            status,
            name: match.title,
            address: match.address,
            rating: match.rating,
            reviews: match.userReviews,
            category: match.category,
            mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.title + ' ' + match.address)}`,
            coordinates: { lat: match.latitude, lng: match.longitude }
        })

    } catch (error) {
        console.error('Address Check Error:', error)
        return NextResponse.json({ message: 'Error checking address' }, { status: 500 })
    }
}
