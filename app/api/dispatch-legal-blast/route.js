import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { EMAIL_TEMPLATE } from '@/app/lib/emailTemplate'
import dataBrokers from '@/app/lib/dataBrokers.json'

export const runtime = 'edge'

export async function POST(req) {
    try {
        const { targetName, targetEmail, targetPhone, brokersList } = await req.json()

        if (!targetName || !targetEmail) {
            return NextResponse.json({ message: 'Missing target parameters' }, { status: 400 })
        }

        const activeBrokers = brokersList && brokersList.length > 0 ? brokersList : dataBrokers;
        const bccListResend = activeBrokers.map(b => b.email)

        const legalSubject = `URGENT: Formal Data Erasure Request (POPIA/GDPR) - ${targetName}`
        const legalContent = `
            <p>To the Data Protection Officer / Privacy Compliance Team,</p>
            <p>I am acting as the authorized legal agent for <strong>${targetName}</strong>.</p>
            <p>Under the provisions of the South African Protection of Personal Information Act (POPIA) and the General Data Protection Regulation (GDPR), I am formally requesting the immediate and permanent erasure of all personal data relating to the individual identified below from your databases, marketing lists, and partner syndication networks.</p>
            <div style="background-color: #1f2937; border: 1px solid #374151; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <ul style="list-style: none; padding: 0; margin: 0; color: #f8fafc;">
                    <li><strong style="color: #94a3b8;">Full Name:</strong> ${targetName}</li>
                    <li style="margin-top: 8px;"><strong style="color: #94a3b8;">Email Address:</strong> ${targetEmail}</li>
                    <li style="margin-top: 8px;"><strong style="color: #94a3b8;">Phone Number:</strong> ${targetPhone}</li>
                </ul>
            </div>
            <p>Please consider this a formal legal notice. You have 30 days to comply with this erasure request and provide confirmation.</p>
            <p>If you require identity verification to process this deletion, please reply directly to this email to contact the data subject (${targetEmail}).</p>
            <p>Sincerely,<br>CheckIt SA Legal Compliance Team</p>
        `
        const legalHtml = EMAIL_TEMPLATE(`Data Erasure Notice`, legalContent)

        const cfEnv = getRequestContext().env;
        const apiKey = cfEnv?.SMTP2GO_API_KEY || (typeof process !== 'undefined' ? process.env.SMTP2GO_API_KEY : null);

        if (!apiKey) {
            throw new Error("CRITICAL: SMTP2GO API Key is missing from the environment.");
        }

        const legalPayload = {
            api_key: apiKey,
            sender: 'info@checkitsa.co.za',
            to: [targetEmail], // Sending to the user to guarantee delivery to them
            bcc: bccListResend, // BCC the brokers to dispatch the legal blast
            subject: legalSubject,
            html_body: legalHtml
        };

        const legalRes = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(legalPayload)
        });

        if (!legalRes.ok && legalRes.status !== 200 && legalRes.status !== 202) {
            const err = await legalRes.text();
            throw new Error("SMTP2GO API Rejected Legal Blast: " + err);
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Dispatch Legal Blast Error:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
