import { NextRequest, NextResponse } from "next/server"

interface MetaData {
  favicon: string
  title: string
  description: string
}

// In-memory cache for fetched metadata (lasts 1 hour)
const metaCache = new Map<string, { data: MetaData; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000

async function fetchMetaData(url: string): Promise<MetaData> {
  const cached = metaCache.get(url)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return { favicon: '', title: url, description: '' }
  }

  const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MetaFetcher/1.0)",
      },
      signal: AbortSignal.timeout(1500), // Fast 1.5s timeout
    })
    
    const html = await response.text()
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : hostname
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    const description = descMatch ? descMatch[1].trim() : ""
    
    const result = { favicon, title, description }
    metaCache.set(url, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  } catch {
    const fallback = { favicon, title: hostname, description: "" }
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
  
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }
  
  const metaData = await fetchMetaData(url)
  return NextResponse.json(metaData, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}