-- Add email notification preference for security intel
ALTER TABLE users ADD COLUMN receive_security_intel BOOLEAN DEFAULT FALSE;
