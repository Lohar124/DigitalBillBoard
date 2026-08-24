import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/leaderboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const items = await getLeaderboard();
  return NextResponse.json(
    { items },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
