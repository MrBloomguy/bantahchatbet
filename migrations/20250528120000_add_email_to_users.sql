-- Add an email column to the users table if it does not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Optionally, you can add a unique constraint if you want emails to be unique:
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
