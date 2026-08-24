import { NextRequest, NextResponse } from "next/server"
import { autoCategorizeWebsite } from "@/lib/categories"

interface MetaData {
  favicon: string
  title: string
  description: string
  category: string
}

// In-memory cache for fetched metadata (lasts 1 hour)
const metaCache = new Map<string, { data: MetaData; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000
const MAX_CACHE_SIZE = 500

// ── SSRF Protection ────────────────────────────────────────────────
// Block requests to private/reserved IP ranges and non-http(s) schemes.
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'metadata',
])

function isPrivateIP(hostname: string): boolean {
  // Block well-known private hostnames
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) return true

  // Block IPv4 private/reserved ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number)
    if (a === 10) return true                          // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
    if (a === 192 && b === 168) return true             // 192.168.0.0/16
    if (a === 169 && b === 254) return true             // 169.254.0.0/16 (link-local / cloud metadata)
    if (a === 127) return true                          // 127.0.0.0/8
    if (a === 0) return true                            // 0.0.0.0/8
  }

  return false
}

function isAllowedUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { ok: false, reason: 'Invalid URL' }
  }

  // Only allow http and https schemes
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs are allowed' }
  }

  // Block private/reserved hostnames and IPs
  if (isPrivateIP(parsed.hostname)) {
    return { ok: false, reason: 'Requests to private/internal addresses are not allowed' }
  }

  return { ok: true, url: parsed }
}
// ────────────────────────────────────────────────────────────────────

async function fetchMetaData(url: string): Promise<MetaData> {
  const cached = metaCache.get(url)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return { favicon: '', title: url, description: '', category: 'other' }
  }

  const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MetaFetcher/1.0)",
      },
      redirect: 'manual', // Don't follow redirects to prevent SSRF bypass
      signal: AbortSignal.timeout(1500),
    })

    // Block redirects to private IPs
    const location = response.headers.get('location')
    if (location) {
      const check = isAllowedUrl(location)
      if (!check.ok) {
        return { favicon, title: hostname, description: '', category: 'other' }
      }
    }

    const html = await response.text()

    // Limit how much HTML we read (prevent memory abuse)
    const safeHtml = html.slice(0, 50_000)

    const titleMatch = safeHtml.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : hostname

    const descMatch = safeHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || safeHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    const description = descMatch ? descMatch[1].trim() : ""

    const category = autoCategorizeWebsite(`${title} ${description} ${safeHtml} ${hostname}`);
    const result = { favicon, title, description, category }

    // Evict oldest entries if cache is too large
    if (metaCache.size >= MAX_CACHE_SIZE) {
      const firstKey = metaCache.keys().next().value
      if (firstKey) metaCache.delete(firstKey)
    }
    metaCache.set(url, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  } catch {
    const category = autoCategorizeWebsite(hostname);
    const fallback = { favicon, title: hostname, description: "", category }
    if (metaCache.size >= MAX_CACHE_SIZE) {
      const firstKey = metaCache.keys().next().value
      if (firstKey) metaCache.delete(firstKey)
    }
    metaCache.set(url, { data: fallback, expiresAt: Date.now() + CACHE_TTL_MS })
    return fallback
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  // SSRF validation
  const check = isAllowedUrl(url)
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 })
  }

  const metaData = await fetchMetaData(url)
  return NextResponse.json(metaData, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}