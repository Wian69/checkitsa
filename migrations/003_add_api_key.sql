-- Add api_key to users table
ALTER TABLE users ADD COLUMN api_key TEXT UNIQUE;
