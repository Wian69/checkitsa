import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { sendSESEmail } from '@/app/lib/mailer'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { fullName, email, password, ref } = await req.json()
        const db = getRequestContext().env.DB

        if (!fullName || !email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Check if user exists
        const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?')
            .bind(email)
            .first()

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 })
        }

        // Generate Referral Code: FirstName + 3 Random Digits (e.g. WIAN123)
        const firstName = fullName.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 8) || 'USER'
        const randomDigits = Math.floor(100 + Math.random() * 900) // 100-999
        const referralCode = `${firstName}${randomDigits}`
        const newId = crypto.randomUUID()

        const { success } = await db.prepare(
            'INSERT INTO users (id, fullName, email, password, tier, searches, createdAt, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
            .bind(newId, fullName, email, password, 'free', 0, new Date().toISOString(), referralCode, ref || null)
            .run()

        if (!success) {
            throw new Error('Failed to create user')
        }

        // Fetch the new user to return it (D1 doesn't reliably support RETURNING for all clients yet)
        const newUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()

        // --- EMAIL NOTIFICATIONS ---
        const env = getRequestContext().env;
        const baseUrl = 'https://checkitsa.co.za';

        const adminHtml = EMAIL_TEMPLATE(
            `🚨 New User Registration: ${fullName}`,
            `<p>A new user has registered on CheckItSA.</p>
             <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #6366f1; border-radius: 4px;">
                 <strong>Name:</strong> ${fullName}<br/>
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
                sendSESEmail(env, { to: 'info@checkitsa.co.za', subject: `🚨 New User Registration: ${fullName}`, html: adminHtml }),
                sendSESEmail(env, { to: email, subject: `Welcome to CheckItSA! 🛡️ Upgrade to Pro`, html: userHtml })
            ]);
        } catch (emailErr) {
            console.error("Registration email dispatch failed:", emailErr);
        }
        // -----------------------------

        return NextResponse.json({
            message: 'User created',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                tier: 'free',
                referral_code: newUser.referral_code,
                wallet_balance: 0
            }
        })
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 })
    }
}
