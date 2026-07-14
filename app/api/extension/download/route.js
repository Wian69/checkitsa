import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { email, id } = await req.json()
        const db = getRequestContext().env.DB

        if (!email || !id) {
            return NextResponse.json({ message: 'Missing auth details' }, { status: 400 })
        }

        // 1. Get User and verify ID matches to prevent unauthorized downloading
        const user = await db.prepare('SELECT * FROM users WHERE email = ? AND id = ?').bind(email, id).first()
        if (!user) {
            return NextResponse.json({ message: 'User not found or unauthorized' }, { status: 401 })
        }

        // 2. Fetch the base ZIP from the public folder via absolute URL
        const baseUrl = new URL('/', req.url).origin
        const zipResponse = await fetch(`${baseUrl}/checkitsa-extension.zip`)
        
        if (!zipResponse.ok) {
            throw new Error(`Failed to fetch base zip: ${zipResponse.statusText}`)
        }

        const zipBuffer = await zipResponse.arrayBuffer()
        
        // 3. Unzip into memory
        const zip = new JSZip()
        await zip.loadAsync(zipBuffer)

        // 4. Inject auto-connect logic into popup.js by prepending it
        const oldPopupJs = await zip.file("popup.js").async("string")
        
        // We inject window.AUTO_AUTH at the top
        const injection = `
// INJECTED BY CHECKITSA SERVER FOR AUTO-CONNECT
const AUTO_AUTH = { email: "${user.email}", password: "${user.password}", tier: "${user.tier}" };

chrome.storage.local.get(['autoAuthRan'], (res) => {
    if (!res.autoAuthRan) {
        chrome.storage.local.set({
            userEmail: AUTO_AUTH.email,
            userAuth: AUTO_AUTH.password,
            userTier: AUTO_AUTH.tier,
            autoAuthRan: true
        }, () => {
            // Force reload to apply auth immediately on first open
            window.location.reload();
        });
    }
});
        `;
        
        zip.file("popup.js", injection + "\n" + oldPopupJs);

        // 5. Generate new ZIP
        const newZipBlob = await zip.generateAsync({ type: "blob" })

        // 6. Return as downloadable file
        return new NextResponse(newZipBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="checkitsa-extension-autoconnect.zip"'
            }
        })

    } catch (error) {
        console.error('Download Extension Error:', error)
        return NextResponse.json({ message: 'Server error generating extension' }, { status: 500 })
    }
}
