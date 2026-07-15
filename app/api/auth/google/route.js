import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { sendSESEmail } from '@/app/lib/mailer'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { token, context } = await req.json()
        const db = getRequestContext().env.DB

        if (!token) {
            return NextResponse.json({ message: 'Missing token' }, { status: 400 })
        }

        // Verify Google Token (Edge-friendly method)
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)

        if (!googleRes.ok) {
            throw new Error('Invalid Google Token')
        }

        const payload = await googleRes.json()
        const { email, name, sub } = payload

        // Check if user exists
        let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        // STRICT Login Enforcement
        if (!user) {
            if (context === 'login') {
                return NextResponse.json({ message: 'You must signup first before logging in.' }, { status: 404 })
            }

            // If context is 'signup' (or undefined/fallback logic), create user
            const tempPassword = Math.random().toString(36).slice(-8)

            await db.prepare(
                'INSERT INTO users (fullName, email, password, tier, searches, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
            )
                .bind(name, email, tempPassword, 'free', 0, new Date().toISOString())
                .run()

            user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

            // --- EMAIL NOTIFICATIONS ---
            const env = getRequestContext().env;
            const baseUrl = 'https://checkitsa.co.za';

            const adminHtml = EMAIL_TEMPLATE(
                `🚨 New User Registration (Google): ${name}`,
                `<p>A new user has registered on CheckItSA via Google Sign-In.</p>
                 <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #6366f1; border-radius: 4px;">
                     <strong>Name:</strong> ${name}<br/>
                     <strong>Email:</strong> ${email}<br/>
                     <strong>Plan Tier:</strong> Free
                 </div>`,
                 `<p>CheckItSA Admin Notification</p>`
            );

            const userHtml = EMAIL_TEMPLATE(
                `Welcome to CheckItSA! 🛡️ Upgrade to Pro`,
                `<p>Welcome to South Africa's leading fraud prevention network! You are currently on the <strong>Free Basic Plan</strong>.</p>
                 <p>CheckItSA empowers you to verify businesses, report scams, and check phone numbers in real-time. However, to get total peace of mind, we highly recommend upgrading to our Premium plans.</p>
                 <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
                     <strong style="color: #10b981; font-size: 18px;">🔥 Why Upgrade to Premium?</strong>
                     <ul style="margin-top: 15px; padding-left: 20px; line-height: 1.6;">
                         <li><strong>Unlimited Deep Scans:</strong> Search historical internet records for phone numbers and URLs.</li>
                         <li><strong>Automated Privacy Scrubbing:</strong> Force data brokers to delete your phone number from spam lists.</li>
                         <li><strong>Business Promotion:</strong> Promote your own business as a 'Verified Partner'.</li>
                     </ul>
                 </div>
                 <a href="${baseUrl}/subscription" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Pricing & Upgrade Now →</a>`,
                 `<p>Thank you for joining the CheckItSA community.</p>`
            );

            try {
                // We use Promise.all to send them concurrently
                await Promise.all([
                    sendSESEmail(env, { to: 'info@checkitsa.co.za', subject: `🚨 New User Registration: ${name}`, html: adminHtml }),
                    sendSESEmail(env, { to: email, subject: `Welcome to CheckItSA! 🛡️ Upgrade to Pro`, html: userHtml })
                ]);
            } catch (emailErr) {
                console.error("Registration email dispatch failed:", emailErr);
            }
            // -----------------------------
        }

        return NextResponse.json({
            message: 'Authenticated',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                tier: user.tier || 'free'
            }
        })

    } catch (error) {
        console.error('Google Auth Error:', error)
        return NextResponse.json({ message: 'Authentication failed' }, { status: 401 })
    }
}
