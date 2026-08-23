import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateLeaderboardCache } from '@/lib/leaderboard';

// ── Bot Detection ──────────────────────────────────────────────────
const DEPLOY_CHECK_USER_AGENTS = [
  'vercel',
  'vercel-runtime',
  'vercel-health',
  'vercel-cli',
  'vercel-buildbot',
  'github-actions',
  'github-checks',
  'github-com',
  'gitbot',
  'Googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot',
  'ia_archiver',
];

// ── IP-based Rate Limiting (1 click per URL per IP per 60 seconds) ──
const clickRateMap = new Map<string, number>();
const CLICK_RATE_WINDOW_MS = 60 * 1000;
const MAX_RATE_MAP_SIZE = 10_000;

function isClickRateLimited(ip: string, url: string): boolean {
  const key = `${ip}::${url}`;
  const now = Date.now();
  const lastClick = clickRateMap.get(key);

  if (lastClick && now - lastClick < CLICK_RATE_WINDOW_MS) {
    return true; // Rate limited
  }

  // Evict oldest entries if map is too large to prevent memory abuse
  if (clickRateMap.size >= MAX_RATE_MAP_SIZE) {
    let oldest = Infinity;
    let oldestKey = '';
    for (const [k, ts] of clickRateMap.entries()) {
      if (ts < oldest) {
        oldest = ts;
        oldestKey = k;
      }
      // Fast eviction: remove expired entries while iterating
      if (now - ts > CLICK_RATE_WINDOW_MS) {
        clickRateMap.delete(k);
      }
    }
    if (clickRateMap.size >= MAX_RATE_MAP_SIZE && oldestKey) {
      clickRateMap.delete(oldestKey);
    }
  }

  clickRateMap.set(key, now);
  return false;
}

export async function POST(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';

  // Block known bots / deploy checks
  for (const agent of DEPLOY_CHECK_USER_AGENTS) {
    if (ua.toLowerCase().includes(agent.toLowerCase())) {
      return NextResponse.json({ ok: true, counted: false });
    }
  }

  if (ua.length === 0) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const body = await request.json().catch(() => null);
  const url: string | undefined = body?.url;

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Rate limit: 1 click per URL per IP per 60 seconds
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  if (isClickRateLimited(ip, url)) {
    return NextResponse.json({ ok: true, counted: false, reason: 'rate_limited' });
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.rpc('increment_clicks', { entry_url: url });

  if (error) {
    console.error('Click increment error:', error);
    return NextResponse.json({ error: 'Failed to record click' }, { status: 500 });
  }

  await invalidateLeaderboardCache();

  return NextResponse.json({ ok: true, counted: true });
}
