-- ==============================================================================
-- Digital Billboard Database Schema
-- Run this in your Supabase Dashboard -> SQL Editor -> Click Run
-- ==============================================================================

-- 1. Create Leaderboard Entries Table
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  url TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bid_cents BIGINT NOT NULL DEFAULT 100,
  clicks BIGINT NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Bids History / Audit Table
CREATE TABLE IF NOT EXISTS public.bids (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_url TEXT NOT NULL,
  entry_name TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  polar_checkout_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Sponsor Slots Table (10 slots)
CREATE TABLE IF NOT EXISTS public.sponsor_slots (
  slot_number INTEGER PRIMARY KEY CHECK (slot_number >= 1 AND slot_number <= 10),
  url TEXT,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- 4. Create Click Increment Function
CREATE OR REPLACE FUNCTION public.increment_clicks(entry_url TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.leaderboard_entries
  SET clicks = clicks + 1
  WHERE url = entry_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Row Level Security & Allow Public Read Access
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on leaderboard_entries" 
  ON public.leaderboard_entries FOR SELECT USING (true);

CREATE POLICY "Allow public read on sponsor_slots" 
  ON public.sponsor_slots FOR SELECT USING (true);

-- (Service Role key bypasses RLS for inserts/updates)
