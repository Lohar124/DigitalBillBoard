import { NextRequest, NextResponse } from 'next/server';

// Real-time presence tracker for live online users
const activeSessions = new Map<string, number>();
const ACTIVE_TIMEOUT_MS = 45 * 1000;

// In-memory cache for Vercel official analytics to ensure ultra-fast response times
let cachedVercelData: { visitors: number; pageviews: number; timestamp: number } | null = null;

async function getVercelAnalyticsStats() {
  const now = Date.now();
  if (cachedVercelData && now - cachedVercelData.timestamp < 10000) {
    return cachedVercelData;
  }

  const token = process.env.VERCEL_AUTH_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return cachedVercelData;
  }

  try {
    // Vercel Hobby plan requires since to be within 30 days and requires until
    const since = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString();
    const until = new Date(now + 24 * 60 * 60 * 1000).toISOString();

    const teamParam = teamId ? `&teamId=${encodeURIComponent(teamId)}` : '';
    const res = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/count?projectId=${projectId}&environment=production&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}${teamParam}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        cachedVercelData = {
          visitors: Number(json.data.visitors) || 0,
          pageviews: Number(json.data.pageviews) || 0,
          timestamp: now,
        };
        return cachedVercelData;
      }
    } else {
      const errText = await res.text();
      console.error('Vercel Analytics API error response:', errText);
    }
  } catch (err) {
    console.error('Error fetching Vercel Analytics:', err);
  }

  return cachedVercelData;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const sessionId = body?.session_id ? `client_${body.session_id}` : `ip_${ip}`;

  const now = Date.now();
  activeSessions.set(sessionId, now);
  for (const [id, lastSeen] of activeSessions.entries()) {
    if (now - lastSeen > ACTIVE_TIMEOUT_MS) {
      activeSessions.delete(id);
    }
  }

  const vercelStats = await getVercelAnalyticsStats();
  const totalVisitors = vercelStats ? vercelStats.visitors : Math.max(1, activeSessions.size);

  return NextResponse.json({
    online: Math.max(1, activeSessions.size),
    totalVisits: totalVisitors,
  });
}

export async function GET() {
  const vercelStats = await getVercelAnalyticsStats();
  const totalVisitors = vercelStats ? vercelStats.visitors : Math.max(1, activeSessions.size);

  return NextResponse.json({
    online: Math.max(1, activeSessions.size),
    totalVisits: totalVisitors,
  });
}
