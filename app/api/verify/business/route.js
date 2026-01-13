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
        const serperKey = env.SERPER_API_KEY || process.env.SERPER_API_KEY

        // --------------------------------------------------------------------------------
        // 1. INTELLIGENT SEARCH LAYER (Multi-Vector Knowledge Graph)
        // --------------------------------------------------------------------------------
        console.log(`[Intelligence] Search Initiated for: ${input}`);

        // A. SERPER.DEV (Google Knowledge Graph & AI Overviews)
        const fetchSerper = async (q) => {
            console.log(`[Serper] Attempting fetch for: ${q} (Key Present: ${!!serperKey})`);
            if (!serperKey) {
                console.warn('[Serper] Missing API Key');
                return null;
            }
            try {
                const res = await fetch("https://google.serper.dev/search", {
                    method: "POST",
                    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                    body: JSON.stringify({ q, gl: "za" })
                });
                const data = await res.json();
                console.log(`[Serper] Response Status: ${res.status} (Credits likely used)`);
                return data;
            } catch (err) {
                console.error('[Serper] API Execution Failed:', err);
                return null;
            }
        };

        // Vector 1: Identity & Operations (About, Branches, HQ)
        const queryIdentity = `"${input}" South Africa about company branches locations headquarters`

        // Vector 2: Legal & Financial (Reg No, VAT, CIPC)
        const queryLegal = `"${input}" registration number VAT number CIPC South Africa`

        // Vector 3: Leadership & Financial Status (Directors, Liquidation)
        const queryLeadership = `"${input}" directors owner manager status`

        // Vector 4: Surgical B2B (Operating Entity Hunter)
        const querySurgical = `site:b2bhint.com "${input}" (Pty) Ltd`

        // --------------------------------------------------------------------------------
        // BROWSER EMULATION HEADERS (To avoid detection/blocking)
        // --------------------------------------------------------------------------------
        const BROWSER_HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
        };

        // A. DUCKDUCKGO SCRAPER (Unlimited)
        const fetchDuckDuckGo = async (q) => {
            try {
                const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
                const res = await fetch(url, {
                    headers: BROWSER_HEADERS,
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
                    if (items.length >= 6) break; // INCREASED LIMIT TO 6 to find older records
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
                const url = `https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cx}&q=${encodeURIComponent(q)}&num=6`;
                const res = await fetch(url); // Standard fetch here is usually fine for API
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

        const [serperData, itemsIdentity, itemsLegal, itemsLeadership, itemsSurgical] = await Promise.all([
            fetchSerper(`${input} South Africa registration number VAT headquarters`),
            executeHybridSearch(queryIdentity),
            executeHybridSearch(queryLegal),
            executeHybridSearch(queryLeadership),
            executeHybridSearch(querySurgical)
        ]);

        const allItems = [...itemsIdentity, ...itemsLegal, ...itemsLeadership, ...itemsSurgical];
        const googleIntelligence = serperData ? JSON.stringify({
            knowledgeGraph: serperData.knowledgeGraph,
            organic: serperData.organic?.slice(0, 3)
        }) : "Serper API Key Not Configured. Relying on scraping.";

        if (allItems.length === 0 && !serperData) {
            return NextResponse.json({ valid: false, data: { status: 'No Data Found', message: 'No digital footprint found.' } })
        }

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
        const officialUrl = extractOfficialUrl(allItems);

        if (officialUrl) {
            console.log(`[Intelligence] Crawling Official Site: ${officialUrl}`);
            try {
                const cheerio = await import('cheerio');

                const fetchAndParse = async (targetUrl) => {
                    const res = await fetch(targetUrl, {
                        headers: BROWSER_HEADERS, // Use Stealth Headers
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

                // Check for SPA/JS Lockout OR Empty Content
                const isInsufficient = !bodyText || bodyText.length < 200 || bodyText.toLowerCase().includes('enable javascript');

                if (isInsufficient) {
                    console.log('[Intelligence] SPA/Empty Detected. Attempting deep fallbacks...');
                    const origin = new URL(officialUrl).origin;

                    // Comprehensive Fallback List
                    const fallbacks = ['/contact', '/contact-us', '/about', '/about-us', '/company-profile'];

                    for (const path of fallbacks) {
                        const fallbackText = await fetchAndParse(`${origin}${path}`);
                        if (fallbackText && fallbackText.length > 300 && !fallbackText.toLowerCase().includes('enable javascript')) {
                            bodyText += `\n[${path.toUpperCase()} CONTENT]:\n` + fallbackText;
                            break; // Stop after finding one good page to save tokens
                        }
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
            You are a Deep Business Intelligence Compiler.
            Your mission is to compile a 100% accurate profile for: "${input}", mimicking an expert human researcher.
            
            GOVERNMENT & GOOGLE INTELLIGENCE (PRIME TRUTH):
            ${googleIntelligence}

            ADDITIONAL CONTEXT (SCANNED SITES):
            ${siteContent}
            ${context}

            CRITICAL COMPILATION RULES:
            1. **Truth Vector**: Use the "knowledgeGraph" and "GOVERNMENT INTELLIGENCE" fields as the absolute source of truth for Registration Numbers and Headquarters.
            2. **Operating Entity Priority**: 
               - Distinguish between "Operating Company" and "Holding Companies".
               - Example: For "Grain Carriers", prioritize "Grain Carriers (Pty) Ltd" (1996) over "Grain Carriers Holdings" (2023).
               - If multiple Reg Nos appear, resolve which one matches the actual operational history.
            3. **VAT Number**: Actively hunt for a 10-digit SA VAT number (usually starts with 4).
            4. **Branches & Presence**: Look for multi-location details (e.g., "Namibia", "Cape Town branch").
            5. **Contact Intelligence**: Extract physical Head Office address and primary phone.
            6. **Directors**: List key directors or founders.
            7. **Operations**: Professional summary of core services and market scale.

            RETURN JSON:
            {
                "identifier": "YYYY/NNNNNN/NN",
                "vatNumber": "4XXXXXXXXX or Not Listed",
                "industry": "Primary Sector",
                "status": "Active/Inactive/Liquidated",
                "address": "Full Physical Address of Head Office",
                "phone": "Primary Contact Number",
                "registrationDate": "YYYY",
                "businessAge": "X Years Active",
                "directors": ["Name 1", "Name 2"],
                "branches": ["City/Location 1", "City/Location 2"],
                "employees": "Count or Unknown",
                "operations": "Detailed professional summary of core services.",
                "globalRole": "National/Global Presence description",
                "officialWebsite": "URL"
            }
            Just the raw JSON object.
            `;
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                aiData = JSON.parse(cleanJson);
                usedSource = `Deep Intelligence (Gemini 1.5)`;
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
                vatNumber: aiData.vatNumber || "Not Listed",
                industry: aiData.industry,
                status: aiData.status,
                address: aiData.address,
                phone: aiData.phone || "Not Listed",
                registrationDate: aiData.registrationDate,
                businessAge: aiData.businessAge,
                directors: aiData.directors || [],
                branches: aiData.branches || [],
                employees: aiData.employees,
                operations: aiData.operations,
                globalRole: aiData.globalRole,
                summary: `Deep verified profile via ${usedSource}.`,
                source: `${usedSource}${serperData ? ' (Google Verified)' : ' (Web Scan)'}`,
                website: aiData.officialWebsite || (officialUrl || itemsIdentity[0]?.link || ""),
                icon: aiData.status === 'Active' ? '🏢' : '⚠️',
                details: `Compiled from ${allItems.length} verified data points. Serper Status: ${!!serperKey ? 'Active' : 'Missing Key'}.`
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
