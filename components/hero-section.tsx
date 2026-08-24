'use client';

import { useState, forwardRef, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Minus, Plus, Loader2, Sparkles, ArrowUpRight } from 'lucide-react';

const XIcon = ({ className, ...props }: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

import type { LeaderboardItem } from '@/lib/leaderboard-data';

interface HeroSectionProps {
  ref?: React.Ref<HTMLInputElement>;
  selectedRank?: number;
  selectedBid?: number;
  items?: LeaderboardItem[];
  onBidChange?: (bid: number) => void;
}

interface UrlPreviewData {
  favicon: string;
  title: string;
  description: string;
  hostname: string;
}

export const HeroSection = forwardRef<HTMLInputElement, HeroSectionProps>(function HeroSection(
  { selectedRank, selectedBid, items = [], onBidChange },
  ref
) {
  const topBid = items.length > 0 ? items[0].bid : 0;
  const defaultTopBid = topBid > 0 ? topBid + 1 : 1;

  const [url, setUrl] = useState('');
  const [bid, setBid] = useState(selectedBid || defaultTopBid);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  // Live URL Metadata Preview State
  const [urlPreview, setUrlPreview] = useState<UrlPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const hasTrackedRef = useRef(false);

  useEffect(() => {
    let sessionId = '';
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('eb_session_id');
      if (!saved) {
        saved = 'v_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        localStorage.setItem('eb_session_id', saved);
      }
      sessionId = saved;
    }

    const isFirstLoad = !hasTrackedRef.current;
    hasTrackedRef.current = true;

    const pingVisitors = (isPageLoad = false) => {
      fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, is_page_load: isPageLoad }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (typeof data.online === 'number') {
            setOnlineCount(data.online);
          }
          if (typeof data.totalVisits === 'number') {
            setTotalVisits(data.totalVisits);
          }
        })
        .catch(() => {});
    };

    pingVisitors(isFirstLoad);
    const interval = setInterval(() => pingVisitors(false), 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedBid) {
      setBid(selectedBid);
    } else if (items.length > 0 && bid === 1 && topBid > 0) {
      setBid(topBid + 1);
    }
  }, [selectedBid, items, topBid]);

  // Debounced URL metadata preview lookup
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || trimmed.length < 3 || (!trimmed.includes('.') && !trimmed.startsWith('@'))) {
      setUrlPreview(null);
      setIsLoadingPreview(false);
      return;
    }

    const normalizedUrl = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed.replace(/^@/, '')}`;

    let parsedHostname = '';
    try {
      parsedHostname = new URL(normalizedUrl).hostname;
    } catch {
      setUrlPreview(null);
      return;
    }

    setIsLoadingPreview(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(normalizedUrl)}`);
        if (res.ok) {
          const data = await res.json();
          setUrlPreview({
            favicon: data.favicon || `https://www.google.com/s2/favicons?domain=${parsedHostname}&sz=64`,
            title: data.title || parsedHostname,
            description: data.description || '',
            hostname: parsedHostname,
          });
        } else {
          setUrlPreview({
            favicon: `https://www.google.com/s2/favicons?domain=${parsedHostname}&sz=64`,
            title: parsedHostname,
            description: '',
            hostname: parsedHostname,
          });
        }
      } catch {
        setUrlPreview({
          favicon: `https://www.google.com/s2/favicons?domain=${parsedHostname}&sz=64`,
          title: parsedHostname,
          description: '',
          hostname: parsedHostname,
        });
      } finally {
        setIsLoadingPreview(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  const handleClaim = async () => {
    if (!url.trim()) {
      setError('Enter a URL or @handle first');
      return;
    }
    const normalizedUrl = /^https?:\/\//.test(url) ? url : `https://${url.replace(/^@/, '')}`;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, bid }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.checkoutUrl) {
        setError(data?.error || `Checkout failed (${res.status})`);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecrease = () => {
    const newBid = Math.max(1, bid - 1);
    setBid(newBid);
    onBidChange?.(newBid);
  };

  const handleIncrease = () => {
    const newBid = Math.min(100000, bid + 1);
    setBid(newBid);
    onBidChange?.(newBid);
  };

  const calculatedRank =
    items.length > 0 ? items.filter((i) => i.bid >= bid).length + 1 : 1;
  const displayRank = selectedRank || calculatedRank;
  const bidText = `$${bid.toLocaleString()}`;
  const isHandle = url.startsWith('@');

  // Check if this domain is already listed
  const normalizedUrl = url.trim() ? (/^https?:\/\//.test(url) ? url : `https://${url.replace(/^@/, '')}`) : '';
  const existingListing = items.find((i) => {
    try {
      return new URL(i.url).hostname === new URL(normalizedUrl).hostname;
    } catch {
      return false;
    }
  });

  const upgradeCost = existingListing ? Math.max(0, bid - existingListing.bid) : bid;

  return (
    <section className="text-center py-4 sm:py-6">
      {/* Live Activity Pill */}
      <div className="inline-flex items-center gap-2 bg-muted/60 dark:bg-muted/40 border border-border/80 px-3 py-1 rounded-full text-xs mb-5 text-muted-foreground">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        {onlineCount !== null && totalVisits !== null ? (
          <span>
            <strong className="text-foreground font-semibold">{onlineCount}</strong> online ·{' '}
            <strong className="text-foreground font-semibold">{totalVisits.toLocaleString()}</strong> visitors
          </span>
        ) : (
          <span>Live billboard active</span>
        )}
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
        Claim #{displayRank} for{' '}
        <span className="inline-flex items-center gap-1.5 align-middle">
          <button
            type="button"
            onClick={handleDecrease}
            className="inline-flex items-center justify-center size-8 sm:size-9 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Decrease bid"
          >
            <Minus className="size-3.5" />
          </button>
          <input
            type="text"
            value={bidText}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(num) && num >= 1 && num <= 100000) {
                setBid(num);
                onBidChange?.(num);
              }
            }}
            className="bg-transparent border-none outline-none text-foreground text-center font-extrabold text-3xl sm:text-5xl p-0 focus:ring-0 w-auto min-w-0"
            size={bidText.length}
          />
          <button
            type="button"
            onClick={handleIncrease}
            className="inline-flex items-center justify-center size-8 sm:size-9 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Increase bid"
          >
            <Plus className="size-3.5" />
          </button>
        </span>
      </h1>

      <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-xl mx-auto px-4 leading-relaxed">
        {displayRank === 1
          ? topBid > 0
            ? `Top the #1 bid ($${topBid}) to take the highest spot on the board.`
            : 'Be the first to claim #1 on the leaderboard starting at $1.'
          : `A bid of $${bid} will secure spot #${displayRank} on the leaderboard.`}
      </p>

      {/* URL Input and Claim Button */}
      <div className="mt-6 max-w-lg mx-auto px-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            {isLoadingPreview ? (
              <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
            ) : isHandle ? (
              <XIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            ) : (
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            )}
            <Input
              ref={ref}
              placeholder="Your website URL or @handle"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 h-11 text-sm bg-card border-border rounded-xl"
            />
          </div>
          <Button
            size="lg"
            className="h-11 px-6 rounded-xl font-semibold bg-foreground text-background hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
            onClick={handleClaim}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" /> Redirecting...
              </span>
            ) : (
              'Claim'
            )}
          </Button>
        </div>

        {/* Live URL Metadata Preview Card */}
        {urlPreview && (
          <div className="mt-3 p-3 rounded-xl bg-card border border-border text-left flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={urlPreview.favicon}
                  alt={urlPreview.title}
                  width={16}
                  height={16}
                  className="size-4 object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                  <span>{urlPreview.title}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate font-mono">
                  {urlPreview.hostname}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-bold text-foreground">
                Rank #{displayRank}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {existingListing ? (
                  <span>Pay ${upgradeCost} upgrade</span>
                ) : (
                  <span>${bid} total</span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        <p className="text-xs text-muted-foreground mt-2.5">
          Already listed? Enter the same URL or @handle to increase your bid — you only pay the difference.
        </p>
      </div>
    </section>
  );
});
