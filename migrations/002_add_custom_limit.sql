-- Add custom_limit to users table
ALTER TABLE users ADD COLUMN custom_limit INTEGER DEFAULT 0;
