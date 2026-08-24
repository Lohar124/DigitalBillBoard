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

// ── IP-based Rate Limiting ──────────────────────────────────────────
const clickRateMap = new Map<string, number>();
const MAX_RATE_MAP_SIZE = 10_000;

function isClickRateLimited(ip: string, url: string): boolean {
  const isFreeMode = process.env.FREE_CLAIM_MODE === 'true' || process.env.NEXT_PUBLIC_FREE_CLAIM_MODE === 'true';
  // Allow faster testing in free mode (3s window) vs production (30s window)
  const windowMs = isFreeMode ? 3 * 1000 : 30 * 1000;

  const key = `${ip}::${url}`;
  const now = Date.now();
  const lastClick = clickRateMap.get(key);

  if (lastClick && now - lastClick < windowMs) {
    return true; // Rate limited
  }

  // Evict oldest entries if map is too large
  if (clickRateMap.size >= MAX_RATE_MAP_SIZE) {
    for (const [k, ts] of clickRateMap.entries()) {
      if (now - ts > windowMs) {
        clickRateMap.delete(k);
      }
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

  const body = await request.json().catch(() => null);
  const rawUrl: string | undefined = body?.url;

  if (!rawUrl) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Normalize URL
  const url = rawUrl.trim();
  const urlWithoutSlash = url.replace(/\/+$/, '');
  const urlWithSlash = `${urlWithoutSlash}/`;

  // Rate limit check
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  if (isClickRateLimited(ip, url)) {
    return NextResponse.json({ ok: true, counted: false, reason: 'rate_limited' });
  }

  try {
    const supabase = getSupabaseServerClient();

    // 1. Try RPC increment function
    await supabase.rpc('increment_clicks', { entry_url: url });
    await supabase.rpc('increment_clicks', { entry_url: urlWithoutSlash });

    // 2. Invalidate leaderboard cache so next fetch sees new click counts
    await invalidateLeaderboardCache();

    return NextResponse.json({ ok: true, counted: true });
  } catch (error) {
    console.error('Click increment error:', error);
    return NextResponse.json({ error: 'Failed to record click' }, { status: 500 });
  }
}
