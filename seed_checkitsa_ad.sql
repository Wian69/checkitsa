-- Seed CheckItSA Verified Business Listing
INSERT INTO listings (
    user_email, 
    business_name, 
    website_url, 
    description, 
    category, 
    registration_number, 
    images, 
    status, 
    amount_paid, 
    expires_at
) VALUES (
    'wiandurandt69@gmail.com',
    'CheckItSA',
    'https://checkitsa.co.za',
    'South Africa''s leading fraud prevention and verification platform. We empower citizens with tools to verify businesses, detect scams, and report fraudulent activity in real-time. Join our community in building a safer digital South Africa.',
    'Security',
    '2024/CHECK/SA',
    '["/brain/0ff4e542-07ce-4258-957f-5ca320221303/checkitsa_dashboard_preview_1768813727859.png", "/brain/0ff4e542-07ce-4258-957f-5ca320221303/checkitsa_mobile_app_1768813775772.png"]',
    'active',
    0.0,
    '2099-12-31 23:59:59'
);
