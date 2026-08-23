import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateLeaderboardCache } from '@/lib/leaderboard';

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

export async function POST(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';

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

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.rpc('increment_clicks', { entry_url: url });

  if (error) {
    return NextResponse.json({ error: 'Failed to record click' }, { status: 500 });
  }

  await invalidateLeaderboardCache();

  return NextResponse.json({ ok: true, counted: true });
}
