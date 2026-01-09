-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  tier TEXT DEFAULT 'free',
  searches INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- Create Reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL
);
