-- D1 Schema for CheckItSA

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Note: In production, hash this!
    tier TEXT DEFAULT 'free',
    searches INTEGER DEFAULT 0,
    subscription_end DATETIME,
    custom_limit INTEGER DEFAULT 0,
    api_key TEXT UNIQUE,
    notifications_enabled BOOLEAN DEFAULT 1,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    wallet_balance FLOAT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    reason TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Listings Table for Ad Portal
CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'unpaid', -- unpaid, pending_review, active, expired
    payment_ref TEXT UNIQUE,
    amount_paid FLOAT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data (Optional - Admin User)
-- INSERT INTO users (fullName, email, password, tier) VALUES ('Wian', 'wiandurandt69@gmail.com', 'admin123', 'ultimate');
