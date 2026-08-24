import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { LeaderboardItem } from '@/lib/leaderboard-data';

const CACHE_TTL_SECONDS = 5;

// In-memory store fallback for free claim mode & instant responsiveness
let localFallbackEntries: Array<{
  url: string;
  name: string;
  bid_cents: number;
  clicks: number;
  claimed_at: string;
}> = [];

// In-memory cache to prevent excessive database hits
let inMemoryCache: { data: LeaderboardItem[]; expiresAt: number } | null = null;

export async function addLocalLeaderboardEntry(entry: {
  url: string;
  name: string;
  bid_cents: number;
}) {
  const existingIdx = localFallbackEntries.findIndex((e) => e.url === entry.url);
  const record = {
    url: entry.url,
    name: entry.name,
    bid_cents: entry.bid_cents,
    clicks: existingIdx >= 0 ? localFallbackEntries[existingIdx].clicks : 0,
    claimed_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    localFallbackEntries[existingIdx] = record;
  } else {
    localFallbackEntries.push(record);
  }

  inMemoryCache = null;
}

export async function getLeaderboard(): Promise<LeaderboardItem[]> {
  const now = Date.now();

  // 1. Return in-memory cached data if still fresh
  if (inMemoryCache && inMemoryCache.expiresAt > now) {
    return inMemoryCache.data;
  }

  // 2. Fetch from Supabase
  let items: LeaderboardItem[] = [];
  try {
    items = await fetchLeaderboardFromDatabase();
  } catch (e) {
    // If Supabase table is not yet created, use local fallback entries
    items = localFallbackEntries
      .sort((a, b) => b.bid_cents - a.bid_cents)
      .map((row, index) => ({
        rank: index + 1,
        name: row.name,
        bid: row.bid_cents / 100,
        url: row.url,
        clicks: row.clicks,
        time: formatRelativeTime(row.claimed_at),
      }));
  }

  // 3. Cache the result
  inMemoryCache = {
    data: items,
    expiresAt: now + CACHE_TTL_SECONDS * 1000,
  };

  return items;
}

export async function invalidateLeaderboardCache() {
  inMemoryCache = null;
}

async function fetchLeaderboardFromDatabase(): Promise<LeaderboardItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('url, name, bid_cents, clicks, claimed_at')
    .order('bid_cents', { ascending: false })
    .order('claimed_at', { ascending: true });

  if (error) throw error;

  // Merge any local entries not yet in DB
  const dbUrls = new Set((data ?? []).map((r) => r.url));
  const merged = [...(data ?? [])];
  for (const local of localFallbackEntries) {
    if (!dbUrls.has(local.url)) {
      merged.push(local);
    }
  }

  merged.sort((a, b) => b.bid_cents - a.bid_cents);

  return merged.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    bid: row.bid_cents / 100,
    url: row.url,
    clicks: row.clicks || 0,
    time: formatRelativeTime(row.claimed_at),
  }));
}

function formatRelativeTime(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
