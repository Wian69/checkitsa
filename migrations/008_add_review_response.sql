-- Migration: Add response_content to business_reviews
ALTER TABLE business_reviews ADD COLUMN response_content TEXT;
ALTER TABLE business_reviews ADD COLUMN responded_at DATETIME;
