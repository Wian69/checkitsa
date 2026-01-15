import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { productName, offeredPrice } = await req.json()
        const env = getRequestContext().env
        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY

        if (!serperKey) return NextResponse.json({ message: 'Server config error' }, { status: 500 })
        if (!productName || !offeredPrice) return NextResponse.json({ message: 'Missing fields' }, { status: 400 })

        // 1. Search Google Shopping / Organic for Prices in ZA
        const res = await fetch('https://google.serper.dev/shopping', {
            method: 'POST',
            headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: productName,
                gl: 'za',
                hl: 'en',
                num: 10
            })
        })

        const data = await res.json()
        const items = data.shopping || []

        if (items.length === 0) {
            return NextResponse.json({
                status: 'UNKNOWN',
                message: 'Could not find reliable market data for this product.'
            })
        }

        // 2. Intelligent Price Analysis
        // Noise words that indicate accessories, not the main product
        const noiseWords = ['case', 'cover', 'glass', 'screen protector', 'cable', 'charger', 'repair', 'replacement', 'skin', 'pouch', 'battery']

        let validItems = items.filter(item => {
            const title = (item.title || '').toLowerCase()
            return !noiseWords.some(word => title.includes(word))
        })

        // If filtering removed everything (e.g. user searched for a cable), fallback to original items
        if (validItems.length === 0) validItems = items

        // Extract numbers from "R 10,999.00" strings
        let prices = validItems.map(item => {
            const clean = item.price.replace(/[^0-9.]/g, '')
            return parseFloat(clean)
        }).filter(p => !isNaN(p) && p > 0)

        if (prices.length === 0) return NextResponse.json({ status: 'UNKNOWN', message: 'No price data found.' })

        // Outlier Removal (The "Accessory" trap)
        // If we have a mix of Phones (R5000) and Covers (R200), the covers destroy the average.
        // Heuristic: Remove any price that is less than 20% of the HIGHEST price found.
        const maxPrice = Math.max(...prices)
        const threshold = maxPrice * 0.20

        const cleanPrices = prices.filter(p => p > threshold)

        // Use Median for stability, or Average of clean prices
        const sum = cleanPrices.reduce((a, b) => a + b, 0)
        let avg = sum / cleanPrices.length

        // If we have enough data, Median is safer against one high outlier
        if (cleanPrices.length > 2) {
            cleanPrices.sort((a, b) => a - b)
            const mid = Math.floor(cleanPrices.length / 2)
            avg = cleanPrices[mid]
        }

        // 3. Analyze Risk
        // If offered price is < 50% of average => CRITICAL RISK
        // If offered price is < 70% of average => HIGH RISK
        // If offered price is > 150% of average => RIP OFF (But not scam necessarily)

        const userPrice = parseFloat(offeredPrice)
        const ratio = userPrice / avg

        let status = 'SAFE'
        let riskLevel = 'Low'
        let message = 'Price seems realistic compared to market average.'

        if (ratio < 0.5) {
            status = 'CRITICAL'
            riskLevel = 'Critical'
            message = 'Too good to be true! Price is suspiciously low (>50% below market).'
        } else if (ratio < 0.75) {
            status = 'WARNING'
            riskLevel = 'High'
            message = 'Be careful. Price is significantly lower than average.'
        }

        return NextResponse.json({
            status,
            riskLevel,
            marketAverage: Math.round(avg),
            offeredPrice: userPrice,
            priceDiff: Math.round(avg - userPrice),
            message,
            sources: items.slice(0, 3).map(i => ({ title: i.title, price: i.price, source: i.source }))
        })

    } catch (error) {
        console.error('Deal Check Error:', error)
        return NextResponse.json({ message: 'Error checking deal' }, { status: 500 })
    }
}
