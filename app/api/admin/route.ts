import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateLeaderboardCache } from '@/lib/leaderboard';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-secret') || request.headers.get('authorization');
  return auth === ADMIN_SECRET || auth === `Bearer ${ADMIN_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: entries, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .order('bid_cents', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ entries: entries || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Database query failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, url, category, is_hidden } = body;
    const supabase = getSupabaseServerClient();

    if (action === 'toggle_visibility') {
      await supabase
        .from('leaderboard_entries')
        .update({ is_hidden })
        .eq('url', url);
    } else if (action === 'update_category') {
      await supabase
        .from('leaderboard_entries')
        .update({ category })
        .eq('url', url);
    } else if (action === 'delete') {
      await supabase
        .from('leaderboard_entries')
        .delete()
        .eq('url', url);
    }

    await invalidateLeaderboardCache();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Moderation action failed' }, { status: 500 });
  }
}
