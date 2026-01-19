
/**
 * Test Seed Script for CheckItSA
 * This script demonstrates the SQL needed to create a verified test ad.
 * You can run this against your local D1 database.
 */

const businessName = "Antigravity Security Labs";
const websiteUrl = "https://antigravity.security";
const description = "Elite cybersecurity audits and phishing protection for South African enterprises. Verified and trusted.";
const category = "Security";

const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30);
const expiresAt = expiryDate.toISOString().replace('T', ' ').slice(0, 19);

const sql = `
INSERT INTO listings (
    business_name, 
    website_url, 
    description, 
    category, 
    status, 
    payment_ref, 
    amount_paid, 
    expires_at
) VALUES (
    '${businessName}',
    '${websiteUrl}',
    '${description}',
    '${category}',
    'active',
    'test_ref_${Math.floor(Math.random() * 100000)}',
    150.00,
    '${expiresAt}'
);
`;

console.log("--- TEST AD SQL ---");
console.log(sql);
console.log("-------------------");
console.log("\nTo run this locally with Wrangler, use:");
console.log("npx wrangler d1 execute DB --local --command=\"" + sql.replace(/\n/g, ' ').trim() + "\"");
