import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { LeaderboardItem } from '@/lib/leaderboard-data';

const CACHE_TTL_SECONDS = 30;

// In-memory cache to prevent excessive database hits
let inMemoryCache: { data: LeaderboardItem[]; expiresAt: number } | null = null;

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
    console.error('Failed to fetch leaderboard from database:', e);
    items = [];
  }

  // 3. Cache the result for 30 seconds
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

  return (data ?? []).map((row, index) => ({
    rank: index + 1,
    name: row.name,
    bid: row.bid_cents / 100,
    url: row.url,
    clicks: row.clicks,
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
