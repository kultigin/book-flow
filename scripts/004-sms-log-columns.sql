-- Add missing columns to sms_log that lib/sms.ts expects
ALTER TABLE sms_log ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending';
ALTER TABLE sms_log ADD COLUMN IF NOT EXISTS error_message TEXT;
