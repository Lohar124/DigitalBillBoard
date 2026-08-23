import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/leaderboard';

export async function GET() {
  const items = await getLeaderboard();
  return NextResponse.json({ items });
}
