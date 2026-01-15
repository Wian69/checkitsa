
export const EMAIL_TEMPLATE = (title, content, callToAction = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #030712;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; border-bottom: 1px solid #1f2937; background: linear-gradient(to right, #1f2937, #111827);">
                            <h1 style="margin: 0; font-size: 24px; color: #6366f1; font-weight: 700; display: inline-block;">CheckItSA</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px; color: #d1d5db; line-height: 1.6; font-size: 16px;">
                            <h2 style="margin-top: 0; margin-bottom: 20px; color: #f9fafb; font-size: 20px;">${title}</h2>
                            ${content}
                            ${callToAction ? `
                            <div style="margin-top: 30px; text-align: center;">
                                ${callToAction}
                            </div>
                            ` : ''}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #0d1117; text-align: center; border-top: 1px solid #1f2937;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                &copy; ${new Date().getFullYear()} CheckItSA. All rights reserved.<br>
                                Stay Safe. Verify Everything.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
