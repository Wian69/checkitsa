
-- Migration: Add user_meta and search_history for cross-device sync
CREATE TABLE IF NOT EXISTS user_meta (
    email TEXT PRIMARY KEY,
    usage_count INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'free',
    custom_limit INTEGER DEFAULT 0,
    last_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    search_type TEXT NOT NULL,
    query TEXT NOT NULL,
    result_status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
