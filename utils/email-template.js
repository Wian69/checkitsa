

export const getMarketingHtml = (businessName = "Business Owner") => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How CheckItSA Works</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CheckItSA</h1>
            <p style="color: #ecfdf5; margin: 10px 0 0 0; font-size: 16px;">How We Build Trust For You</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-top: 0;">Hi ${businessName},</h2>
            
            <p style="font-size: 16px; color: #4b5563;">
                We invited you to CheckItSA because you run a legitimate business. But you might be wondering: <strong>"How does this actually help me get more clients?"</strong>
            </p>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #1e3a8a; font-weight: 600;">The Problem: Scams are everywhere.</p>
                <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 14px;">Customers are scared. They ignore ads and emails because they don't know who is real.</p>
            </div>

            <h3 style="color: #111827; font-size: 18px; font-weight: 700;">Here is how CheckItSA fixes that for you:</h3>

            <div style="margin: 25px 0;">
                <div style="display: flex; margin-bottom: 20px;">
                    <div style="min-width: 40px; height: 40px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; color: #059669;">1</div>
                    <div>
                        <strong style="color: #111827;">We Verify You (Deeply)</strong>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">We check your CIPC registration, ID, Banking, and Business Address to prove you exist.</p>
                    </div>
                </div>

                <div style="display: flex; margin-bottom: 20px;">
                    <div style="min-width: 40px; height: 40px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; color: #059669;">2</div>
                    <div>
                        <strong style="color: #111827;">You Get The "Verified" Badge</strong>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">This badge tells every visitor instantly: "This business is SAFE to pay."</p>
                    </div>
                </div>

                <div style="display: flex;">
                    <div style="min-width: 40px; height: 40px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; color: #059669;">3</div>
                    <div>
                        <strong style="color: #111827;">We Send You Traffic</strong>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Verified businesses appear on our Homepage Carousel and top search results.</p>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
                <a href="https://checkitsa.co.za/advertise" style="background-color: #059669; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.4);">
                    Claim Your Verified Profile
                </a>
            </div>
            
             <p style="font-size: 14px; color: #6b7280; text-align: center;">
                 It costs less than taking a client for coffee (R99/month).
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                &copy; ${new Date().getFullYear()} CheckItSA. All rights reserved.<br>
            </p>
        </div>
    </div>
</body>
</html>
`;
export const getInviteHtml = (businessName = "Business Owner") => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Business on CheckItSA</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CheckItSA</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">South Africa's Trusted Verification Platform</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-top: 0;">Hello ${businessName},</h2>
            
            <p style="font-size: 16px; color: #4b5563;">
                Distrust in South Africa is at an all-time high. Customers verify everything before they buy. 
                <strong>Is your business showing up as trusted?</strong>
            </p>

            <p style="font-size: 16px; color: #4b5563;">
                We are inviting select South African businesses to join our <strong>Verified Partner Network</strong>.
            </p>

            <!-- Benefits Grid -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin-top: 0; color: #4f46e5; font-size: 18px;">Why Get Verified?</h3>
                <ul style="padding-left: 20px; margin-bottom: 0; color: #374151;">
                    <li style="margin-bottom: 10px;"><strong>Homepage Exposure:</strong> Your business will be featured in our new "Pause-on-Hover" carousel, seen by thousands of safety-conscious visitors.</li>
                    <li style="margin-bottom: 10px;"><strong>Trust Badge:</strong> Display the "CIPC Verified" seal on your profile.</li>
                    <li style="margin-bottom: 0;"><strong>Click Tracking:</strong> See exactly how many customers click through to your website from our dashboard.</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
                <a href="https://checkitsa.co.za/advertise" style="background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">
                    Get Verified Now
                </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center;">
                Join 50,000+ South Africans building a safer digital economy.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                &copy; ${new Date().getFullYear()} CheckItSA. All rights reserved.<br>
                <a href="https://checkitsa.co.za" style="color: #6b7280; text-decoration: underline;">Visit Website</a>
            </p>
        </div>
    </div>
</body>
</html>
`;
