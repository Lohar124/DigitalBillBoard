import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/leaderboard';

export async function GET() {
  const items = await getLeaderboard();
  return NextResponse.json(
    { items },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      },
    }
  );
}
