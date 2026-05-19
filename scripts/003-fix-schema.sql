-- Fix schema to match application code expectations
-- Bookings: replace timestamp start_time/end_time with date + time columns
-- Blocked_dates: rename blocked_date to date

-- Drop bookings (no real data yet) and recreate with correct columns
DROP TABLE IF EXISTS bookings CASCADE;

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by_account_holder_id UUID REFERENCES account_holders(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  cancellation_token VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_business_date ON bookings(business_id, date);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Rename blocked_date column to date
ALTER TABLE blocked_dates RENAME COLUMN blocked_date TO date;

-- Add unique constraint for blocked_dates (used by ON CONFLICT)
ALTER TABLE blocked_dates DROP CONSTRAINT IF EXISTS blocked_dates_business_id_date_key;
ALTER TABLE blocked_dates ADD CONSTRAINT blocked_dates_business_id_date_key UNIQUE (business_id, date);

-- Ensure availability table has slot_duration column referenced by code
ALTER TABLE availability ADD COLUMN IF NOT EXISTS slot_duration INTEGER NOT NULL DEFAULT 30;
