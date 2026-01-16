import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const env = getRequestContext()?.env || {}
        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY
        const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

        if (!serperKey || !geminiKey) {
            return NextResponse.json({ error: 'Missing API Keys' }, { status: 500 })
        }

        // 1. Search for recent victims/queries
        const queries = [
            'site:reddit.com/r/southafrica "scam" after:24h',
            'site:reddit.com/r/PersonalFinanceZA "scam" after:24h',
            'site:hellopeter.com "scam" after:24h',
            'site:twitter.com "is this a scam" south africa after:24h',
            'site:facebook.com "scam" south africa after:24h'
        ]

        // Pick a random query or run all (random for now to save credits/speed)
        const q = queries[Math.floor(Math.random() * queries.length)]

        const resSearch = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
            body: JSON.stringify({ q, gl: "za", num: 10 })
        })
        const dataSearch = await resSearch.json()
        const posts = dataSearch.organic || []

        if (posts.length === 0) {
            return NextResponse.json({ posts: [] })
        }

        // 2. Generate Replies with AI
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const processedPosts = await Promise.all(posts.map(async (post) => {
            try {
                const prompt = `
                You are a helpful South African Scam Prevention Expert.
                A user posted this:
                Title: "${post.title}"
                Snippet: "${post.snippet}"
                Link: ${post.link}

                Write a short, punchy, and helpful reply (max 280 chars) inviting them to verify it on CheckItSA.
                Do NOT sound like a bot. Sound like a helpful community member.
                Use South African slang if appropriate (mildly).
                
                Required Include: "checkitsa.co.za"
                
                Reply Text ONLY.
                `

                const result = await model.generateContent(prompt)
                const reply = result.response.text().trim()

                return {
                    id: Math.random().toString(36).substr(2, 9),
                    source: post.link.includes('reddit') ? 'Reddit' : post.link.includes('twitter') ? 'Twitter' : 'Web',
                    title: post.title,
                    snippet: post.snippet,
                    link: post.link,
                    date: post.date || 'Today',
                    suggested_reply: reply
                }
            } catch (e) {
                return null
            }
        }))

        return NextResponse.json({
            query: q,
            posts: processedPosts.filter(p => p !== null)
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
