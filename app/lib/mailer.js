import { SESClient, SendRawEmailCommand, SendEmailCommand } from "@aws-sdk/client-ses";
import { createMimeMessage } from "mimetext";

/**
 * Send an email via Amazon SES.
 *
 * @param {Object} env - The Cloudflare env object containing AWS keys.
 * @param {Object} options - Email options.
 * @param {string|string[]} options.to - Primary recipients.
 * @param {string|string[]} [options.bcc] - BCC recipients.
 * @param {string} options.subject - Email subject.
 * @param {string} options.html - HTML content of the email.
 * @param {string} [options.from] - Sender address.
 * @param {Array} [options.attachments] - Array of attachment objects { filename, content (base64 string), contentType, cid }.
 */
export async function sendSESEmail(env, { to, bcc, subject, html, from, attachments = [] }) {
    const region = env.AWS_REGION || 'af-south-1'; // Default to Cape Town
    const accessKeyId = env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
        console.error("Missing AWS SES credentials in environment variables.");
        return false;
    }

    const sesClient = new SESClient({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const sender = from || 'CheckItSA <no-reply@checkitsa.co.za>';
    const toAddresses = Array.isArray(to) ? to : (to ? [to] : []);
    const bccAddresses = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

    try {
        // If we have attachments, we MUST use SendRawEmailCommand and construct a MIME message
        if (attachments && attachments.length > 0) {
            const msg = createMimeMessage();
            msg.setSender(sender);
            if (toAddresses.length > 0) msg.setTo(toAddresses);
            if (bccAddresses.length > 0) msg.setBcc(bccAddresses);
            msg.setSubject(subject);
            msg.addMessage({
                contentType: 'text/html',
                data: html
            });

            // Add attachments
            attachments.forEach(att => {
                msg.addAttachment({
                    filename: att.filename || att.name,
                    contentType: att.contentType || 'image/jpeg',
                    data: att.content,
                    headers: att.cid ? { 'Content-ID': `<${att.cid}>` } : {}
                });
            });

            const rawMessage = msg.asRaw();
            // SES requires Base64 encoded raw message
            const uint8Array = new TextEncoder().encode(rawMessage);

            const command = new SendRawEmailCommand({
                RawMessage: { Data: uint8Array }
            });

            await sesClient.send(command);
            console.log(`[SES Raw] Email sent successfully to ${toAddresses.length > 0 ? toAddresses.join(', ') : 'BCC'}`);
            return true;

        } else {
            // No attachments, we can use the simpler SendEmailCommand
            const params = {
                Source: sender,
                Destination: {
                    ToAddresses: toAddresses.length > 0 ? toAddresses : undefined,
                    BccAddresses: bccAddresses.length > 0 ? bccAddresses : undefined,
                },
                Message: {
                    Subject: { Data: subject },
                    Body: { Html: { Data: html } },
                },
            };

            const command = new SendEmailCommand(params);
            await sesClient.send(command);
            console.log(`[SES] Email sent successfully to ${toAddresses.length > 0 ? toAddresses.join(', ') : 'BCC'}`);
            return true;
        }

    } catch (error) {
        console.error(`[SES] Error sending email:`, error);
        return false;
    }
}
