-- Migration: Add business_email to business_reviews
ALTER TABLE business_reviews ADD COLUMN business_email TEXT;
