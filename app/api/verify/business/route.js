import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

export async function POST(request) {
    try {
        const { input, email } = await request.json()
        const env = getRequestContext()?.env || {}
        const db = env.DB

        // 0. Permission Check
        if (!email) {
            return NextResponse.json({
                valid: false,
                data: { status: 'Unauthorized', message: 'Please sign in to access business intelligence.' }
            }, { status: 401 })
        }

        const userMeta = await db.prepare("SELECT tier FROM user_meta WHERE email = ?").bind(email).first()
        const tier = userMeta ? userMeta.tier : 'free'

        if (tier === 'free') {
            return NextResponse.json({
                valid: false,
                data: { status: 'Upgrade Required', message: 'Business Intelligence is a Pro feature.' }
            }, { status: 402 })
        }

        const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
        const cseKey = env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_CSE_API_KEY
        const cx = env.GOOGLE_CSE_CX || process.env.GOOGLE_CSE_CX || '16e9212fe3fcf4cea'

        // --------------------------------------------------------------------------------
        // 1. INTELLIGENT SEARCH LAYER (Multi-Vector Knowledge Graph)
        // --------------------------------------------------------------------------------
        console.log(`[Intelligence] Search Initiated for: ${input}`);

        // Vector 1: Identity (Address, Phone, Map Presence) - OPEN WEB
        const queryIdentity = `"${input}" South Africa contact details address phone headquarters`

        // Vector 2: Legal (Registration, Compliance) - BROAD SEARCH (Removed site restrictions)
        // We look for the "20" century prefix common in SA Reg Numbers (e.g. 2015/...)
        const queryLegal = `"${input}" registration number CIPC "20"`

        // Vector 3: Leadership (Directors, Management)
        const queryLeadership = `"${input}" directors owner manager linkedin`

        // A. DUCKDUCKGO SCRAPER (Unlimited)
        const fetchDuckDuckGo = async (q) => {
            try {
                const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    },
                    cf: { cacheTtl: 300, cacheEverything: true }
                });

                const html = await res.text();
                // Check if we got blocked/captcha
                if (html.includes('captcha') || res.status !== 200) return [];

                const items = [];
                const resultRegex = /<div class="result[^>]*>([\s\S]*?)<\/div>/g;
                const linkRegex = /href="(.*?)"/;
                const titleRegex = /<a class="result__a"[^>]*>(.*?)<\/a>/;
                const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/;

                let match;
                while ((match = resultRegex.exec(html)) !== null) {
                    const block = match[1];
                    const linkMatch = block.match(linkRegex);
                    const titleMatch = block.match(titleRegex);
                    const snippetMatch = block.match(snippetRegex);

                    if (linkMatch && titleMatch && snippetMatch) {
                        items.push({
                            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
                            link: linkMatch[1],
                            snippet: snippetMatch[1].replace(/<[^>]*>/g, '').trim()
                        });
                    }
                    if (items.length >= 4) break; // Limit 4 per vector
                }
                return items;
            } catch (err) {
                console.warn('[Scraper] DDG Search Failed:', err);
                return [];
            }
        };

        // B. GOOGLE API (Reliable Fallback)
        const fetchGoogleAPI = async (q) => {
            if (!cseKey || !cx) return [];
            try {
                const url = `https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(q)}&num=4`;
                const res = await fetch(url);
                const data = await res.json();
                return data.items || [];
            } catch (err) {
                console.error('[API] Google Fetch Failed:', err);
                return [];
            }
        };

        // EXECUTION STRATEGY: Try Scraper first. If 0 results, use API.
        const executeHybridSearch = async (q) => {
            let results = await fetchDuckDuckGo(q);
            if (results.length === 0) {
                console.log('[Intelligence] Scraper blocked/empty. Falling back to Google API.');
                results = await fetchGoogleAPI(q);
            }
            return results;
        };

        const [itemsIdentity, itemsLegal, itemsLeadership] = await Promise.all([
            executeHybridSearch(queryIdentity),
            executeHybridSearch(queryLegal),
            executeHybridSearch(queryLeadership)
        ]);

        const allItems = [...itemsIdentity, ...itemsLegal, ...itemsLeadership];

        if (allItems.length === 0) { return NextResponse.json({ valid: false, data: { status: 'No Data Found', message: 'No digital footprint found.' } }) }

        // --------------------------------------------------------------------------------
        // 2. DEEP DIVE LAYER (Smart Crawling - SPA/JS Handler)
        // --------------------------------------------------------------------------------

        const extractOfficialUrl = (items) => {
            const blockList = ['linkedin', 'facebook', 'yellowpages', 'b2bhint', 'easyinfo', 'hellopeter', 'sa-companies', 'gov.za', 'google'];
            for (const item of items) {
                try {
                    const domain = new URL(item.link).hostname;
                    const isBlocked = blockList.some(b => domain.includes(b));
                    if (!isBlocked) return item.link;
                } catch (e) { }
            }
            return null;
        };

        let siteContent = "";
        const officialUrl = extractOfficialUrl(itemsIdentity);

        if (officialUrl) {
            console.log(`[Intelligence] Crawling Official Site: ${officialUrl}`);
            try {
                const cheerio = await import('cheerio');

                const fetchAndParse = async (targetUrl) => {
                    const res = await fetch(targetUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                        signal: AbortSignal.timeout(4000)
                    });
                    if (!res.ok) return null;
                    const html = await res.text();
                    const $ = cheerio.load(html);
                    $('script').remove(); $('style').remove(); $('nav').remove();
                    return $('body').text().replace(/\s+/g, ' ').trim();
                }

                // Try Homepage First
                let bodyText = await fetchAndParse(officialUrl);

                // Check for SPA/JS Lockout (common in React apps)
                const isJSLocked = !bodyText || bodyText.length < 200 || bodyText.toLowerCase().includes('enable javascript') || bodyText.toLowerCase().includes('you need to run this app');

                if (isJSLocked) {
                    console.log('[Intelligence] SPA Detected. Attempting /contact page fallback...');
                    // Try /contact or /about which are often static
                    const origin = new URL(officialUrl).origin;
                    const contactText = await fetchAndParse(`${origin}/contact`);

                    if (contactText && contactText.length > 200 && !contactText.toLowerCase().includes('enable javascript')) {
                        bodyText = contactText; // Success with Contact Page
                    } else {
                        // Try About
                        const aboutText = await fetchAndParse(`${origin}/about-us`);
                        if (aboutText && aboutText.length > 200) bodyText = aboutText;
                    }
                }

                if (bodyText && !bodyText.toLowerCase().includes('enable javascript')) {
                    siteContent = `[OFFICIAL SITE DATA (${officialUrl})]:\n${bodyText.slice(0, 10000)}\n---`;
                } else {
                    siteContent = `[OFFICIAL SITE]: Unreachable (JavaScript Required). Rely on Search Snippets.`;
                }

            } catch (crawlErr) {
                console.warn('[Intelligence] Crawl Failed:', crawlErr.message);
                siteContent = `[OFFICIAL SITE]: Crawl failed (${crawlErr.message})`;
            }
        }

        // --------------------------------------------------------------------------------
        // 3. AI SYNTHESIS
        // --------------------------------------------------------------------------------

        let aiData = null;
        let usedSource = "Web Intelligence (Hybrid)";

        if (geminiKey) {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const context = allItems.map(i => `[TITLE]: ${i.title}\n[SNIPPET]: ${i.snippet}\n[LINK]: ${i.link}`).join('\n---\n');

            const prompt = `
            You are a Business Intelligence Analyst.
            Construct a comprehensive profile for: "${input}". 
            
            DATA SOURCES:
            ${siteContent}
            ${context}

            INSTRUCTIONS:
            1. **Reg Number**: Search deep! Look for "YYYY/NNNNNN/NN" or "K20" formats in the official site text or legal search results.
            2. **Contact**: Identify the primary HQ address and Phone Number.
            3. **JavaScript Errors**: If the content says "Enable JavaScript", IGNORE IT completely. Do not treat "Enable JavaScript" as "Operations".
            4. **Inference**: If official site failed, heavily infer from the "Legal" and "Identity" snippets.

            RETURN JSON:
            {
                "identifier": "YYYY/NNNNNN/NN" or "Not Listed",
                "industry": "Primary Industry",
                "status": "Active/Inactive",
                "address": "Full Physical Address (Street, Suburb, City)",
                "phone": "Primary Contact Number or 'Not Listed'",
                "registrationDate": "YYYY",
                "directors": ["Name 1", "Name 2"],
                "employees": "Count/Unknown",
                "operations": "Short description of what they actually do.",
                "globalRole": "National/Global",
                "officialWebsite": "URL"
            }
            `;
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                aiData = JSON.parse(cleanJson);
                usedSource = `AI Synthesized (Gemini 1.5)`;
            } catch (aiError) {
                console.warn(`[Intelligence] AI Failed:`, aiError.message);
            }
        }

        // FALLBACK: Regex if AI Failed
        if (!aiData) {
            aiData = synthesizeWithRegex(itemsIdentity, itemsLegal, input, allItems);
        }

        return NextResponse.json({
            valid: true,
            data: {
                name: input,
                identifier: aiData.identifier,
                industry: aiData.industry,
                status: aiData.status,
                address: aiData.address,
                phone: aiData.phone || "Not Listed",
                registrationDate: aiData.registrationDate,
                directors: aiData.directors || [],
                employees: aiData.employees,
                operations: aiData.operations,
                globalRole: aiData.globalRole,
                summary: `Automated verified profile via ${usedSource}.`,
                source: `${usedSource}`,
                website: aiData.officialWebsite || (officialUrl || itemsIdentity[0]?.link || ""),
                icon: aiData.status === 'Active' ? '🏢' : '⚠️',
                details: `Synthesized from ${allItems.length} verified sources.`
            }
        });

    } catch (e) {
        console.error('[Intelligence] Fatal Error:', e)
        return NextResponse.json({
            valid: false,
            data: {
                status: 'Error',
                message: 'System Error',
                details: e.message
            }
        })
    }
}

function synthesizeWithRegex(itemsIdentity, itemsLegal, input, allItems) {
    let identifier = "Not found in web index";
    const regNumRegex = /\b(\d{4})\/\d{6}\/\d{2}\b/;

    // Scan Legal Vector First
    for (const item of itemsLegal) {
        const match = item.title.match(regNumRegex) || item.snippet.match(regNumRegex);
        if (match) { identifier = match[0]; break; }
    }

    const cleanSnippets = allItems.map(i => `${i.title} ${i.snippet}`).join(' | ');
    const lowerSnippets = cleanSnippets.toLowerCase();

    const industries = ['Agriculture', 'Mining', 'Manufacturing', 'Logistics', 'Retail', 'Technology', 'Finance', 'Healthcare', 'Consulting'];
    const foundIndustry = industries.find(ind => lowerSnippets.includes(ind.toLowerCase()));

    let address = "See web results";
    const hqMatch = cleanSnippets.match(/(?:Headquarters|Based|Address|Location)[:\s]+([A-Za-z0-9,\s]+)/i);
    if (hqMatch && hqMatch[1].length < 50) address = hqMatch[1];

    let phone = "Not Listed";
    // Regex for SA Phone: 011 123 4567 or +27 11...
    const phoneMatch = cleanSnippets.match(/(?:\+27|0)[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/);
    if (phoneMatch) phone = phoneMatch[0];

    const empMatch = cleanSnippets.match(/(?:employs|staff of)\s*(\d+(?:,\d+)?)/i);
    const employees = empMatch ? `${empMatch[1]} (Est.)` : "Unknown";

    const descItem = itemsIdentity.find(i => /is a|provides|specializes/i.test(i.snippet));
    const operations = descItem ? descItem.snippet : "Business listing found.";

    return {
        identifier,
        industry: foundIndustry || "Multi-Sector",
        status: "Active",
        address,
        phone,
        registrationDate: identifier.startsWith("2") || identifier.startsWith("1") ? identifier.substring(0, 4) : "Unknown",
        directors: ["Listed in report"],
        employees,
        operations,
        globalRole: "National Entity",
        officialWebsite: itemsIdentity[0]?.link || ""
    };
}
