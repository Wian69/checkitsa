-- Add status column to scam_reports table
ALTER TABLE scam_reports ADD COLUMN status TEXT DEFAULT 'pending';
