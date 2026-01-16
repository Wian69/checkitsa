import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const body = await req.json()
        const { image, location, lat: bodyLat, lng: bodyLng, offense, description, reporter_name, reporter_email } = body

        if (!image) {
            return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
        }

        const env = process.env
        let plateNumber = 'Unknown'
        let aiAnalysis = null

        // 1. OCR using Gemini AI
        if (env.GEMINI_API_KEY) {
            try {
                const { GoogleGenerativeAI } = require("@google/generative-ai")
                const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

                // Extract base64 and mime
                const match = image.match(/^data:(.+);base64,(.+)$/)
                const mimeType = match ? match[1] : 'image/jpeg'
                const base64Data = match ? match[2] : image

                const prompt = `
                    Identify the South African vehicle license plate (number plate) in this image.
                    Return ONLY a JSON object: 
                    { 
                        "plate": "PLATE123", 
                        "province": "Gauteng|Western Cape|KwaZulu-Natal|Eastern Cape|Free State|Limpopo|Mpumalanga|North West|Northern Cape", 
                        "confidence": 0-100, 
                        "vehicle_description": "Make/Model/Color if visible" 
                    }
                    Note: For SA plates, use the trailing/prefix letters to identify the province (e.g., GP = Gauteng, CA/CY/CAA = Western Cape, ZN = KZN, FS/L = Free State, N = KZN, EC = Eastern Cape, MP = Mpumalanga, L = Limpopo, NW = North West, NC = Northern Cape).
                `

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    }
                ])

                const responseText = result.response.text().replace(/```json|```/g, "").trim()
                aiAnalysis = JSON.parse(responseText)
                plateNumber = aiAnalysis.plate || 'Unknown'
            } catch (e) {
                console.error('OCR Extraction Failed', e)
            }
        }

        // 2. Geocoding using LocationIQ (Free Tier)
        let lat = bodyLat || -26.2041 // Start with Johannesburg or body coords
        let lng = bodyLng || 28.0473

        if (!bodyLat && location && env.LOCATIONIQ_TOKEN) {
            try {
                const geoUrl = `https://us1.locationiq.com/v1/search?key=${env.LOCATIONIQ_TOKEN}&q=${encodeURIComponent(location + ', South Africa')}&format=json&limit=1`;
                const geoRes = await fetch(geoUrl);
                const geoData = await geoRes.json();
                if (geoData && geoData[0]) {
                    lat = parseFloat(geoData[0].lat);
                    lng = parseFloat(geoData[0].lon);
                }
            } catch (e) {
                console.error('Geocoding failed:', e);
            }
        }

        // 3. Persist to Database
        const db = getRequestContext().env.DB
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS traffic_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plate_number TEXT,
                location TEXT,
                lat DECIMAL,
                lng DECIMAL,
                offense_type TEXT,
                description TEXT,
                evidence_image TEXT,
                reporter_name TEXT,
                reporter_email TEXT,
                province TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME
            )
        `).run()

        // Handle schema update for existing tables (Lat/Lng might be missing)
        try {
            await db.prepare(`ALTER TABLE traffic_reports ADD COLUMN lat DECIMAL`).run()
            await db.prepare(`ALTER TABLE traffic_reports ADD COLUMN lng DECIMAL`).run()
            await db.prepare(`ALTER TABLE traffic_reports ADD COLUMN province TEXT`).run()
        } catch (e) { /* Already exists */ }

        const { success } = await db.prepare(
            `INSERT INTO traffic_reports (
                plate_number, location, lat, lng, offense_type, description, evidence_image, reporter_name, reporter_email, province, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            plateNumber,
            location || 'Unknown',
            lat,
            lng,
            offense || 'General',
            description || 'No description',
            image,
            reporter_name || 'Anonymous',
            reporter_email || 'N/A',
            aiAnalysis?.province || 'Unknown',
            'pending',
            new Date().toISOString()
        ).run()

        if (!success) throw new Error('Database insert failed')

        return NextResponse.json({
            success: true,
            plate: plateNumber,
            details: aiAnalysis,
            lat,
            lng,
            message: `Report for ${plateNumber} registered successfully.`
        })

    } catch (error) {
        console.error('Traffic Report Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(req) {
    try {
        const db = getRequestContext().env.DB
        const { searchParams } = new URL(req.url)
        const plate = searchParams.get('plate')

        let query = "SELECT id, plate_number, location, lat, lng, offense_type, province, status, created_at FROM traffic_reports WHERE status = 'verified' OR status = 'pending' ORDER BY created_at DESC LIMIT 100"
        let params = []

        if (plate) {
            query = "SELECT id, plate_number, location, lat, lng, offense_type, province, status, created_at FROM traffic_reports WHERE plate_number = ? ORDER BY created_at DESC"
            params = [plate]
        }

        const res = await db.prepare(query).bind(...params).all()
        return NextResponse.json({ reports: res.results })
    } catch (error) {
        return NextResponse.json({ reports: [] }, { status: 500 })
    }
}

export async function PATCH(req) {
    try {
        const body = await req.json()
        const { id, status } = body
        const db = getRequestContext().env.DB

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing ID or status' }, { status: 400 })
        }

        const { success } = await db.prepare(
            "UPDATE traffic_reports SET status = ? WHERE id = ?"
        ).bind(status, id).run()

        if (!success) throw new Error('Update failed')

        return NextResponse.json({ success: true, message: `Report ${id} updated to ${status}` })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
