import { NextRequest, NextResponse } from 'next/server';

// ── In-Memory Edge Rate Limiting ──────────────────────────────────
// Sliding window rate limiter for DDoS and spam protection
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRateMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  // Periodic cleanup of stale entries to prevent memory leaks
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, entry] of ipRateMap.entries()) {
      if (now > entry.resetAt) {
        ipRateMap.delete(key);
      }
    }
    lastCleanup = now;
  }

  const entry = ipRateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // Allowed
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  entry.count += 1;
  return true; // Allowed
}

// ── Known Vulnerability Scanner / Exploit Patterns ────────────────
const BLOCKED_PATH_PATTERNS = [
  /\.php$/i,
  /\.env/i,
  /\.git/i,
  /wp-admin/i,
  /wp-login/i,
  /xmlrpc\.php/i,
  /phpmyadmin/i,
  /cgi-bin/i,
  /\.well-known\/security\.txt/i,
  /admin\.php/i,
  /actuator/i,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Block common exploit scanners immediately
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // 2. Extract Client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // 3. API Route DDoS Protection & Rate Limiting
  if (pathname.startsWith('/api/')) {
    // Checkout: Max 10 attempts per minute per IP
    if (pathname === '/api/checkout') {
      const allowed = checkRateLimit(`checkout_${ip}`, 10, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }

    // Metadata Fetch: Max 20 requests per minute per IP
    else if (pathname === '/api/fetch-meta') {
      const allowed = checkRateLimit(`fetch_meta_${ip}`, 20, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }

    // Clicks & Visitors: Max 60 requests per minute per IP
    else if (pathname === '/api/click' || pathname === '/api/visitors') {
      const allowed = checkRateLimit(`active_${ip}`, 60, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded.' },
          { status: 429, headers: { 'Retry-After': '30' } }
        );
      }
    }

    // General API rate limit: Max 120 requests per minute per IP
    else {
      const allowed = checkRateLimit(`general_api_${ip}`, 120, 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many requests.' },
          { status: 429, headers: { 'Retry-After': '30' } }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to API routes and exploit-targeted paths
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
