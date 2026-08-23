-- Run this once against your Supabase project (SQL Editor or `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  name text not null,
  bid_cents integer not null check (bid_cents > 0),
  clicks integer not null default 0,
  claimed_at timestamptz not null default now()
);

create index if not exists leaderboard_entries_bid_cents_idx
  on leaderboard_entries (bid_cents desc);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  entry_url text not null,
  entry_name text not null,
  amount_cents integer not null check (amount_cents > 0),
  polar_checkout_id text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists bids_entry_url_idx on bids (entry_url);

-- 10 Sponsor slots ($49 / 30 days)
create table if not exists sponsor_slots (
  slot_number integer primary key check (slot_number between 1 and 10),
  url text,
  name text,
  description text,
  logo_url text,
  claimed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- All reads/writes go through server-only route handlers using the service
-- role key, so no public RLS policies are required.
alter table leaderboard_entries enable row level security;
alter table bids enable row level security;
alter table sponsor_slots enable row level security;

create or replace function increment_clicks(entry_url text)
returns void as $$
begin
  update leaderboard_entries
  set clicks = clicks + 1
  where url = entry_url;
end;
$$ language plpgsql;
