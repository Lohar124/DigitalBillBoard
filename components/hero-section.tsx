'use client';

import { useState, forwardRef, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Minus, Plus, Sparkles, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError('Something went wrong');
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

  return (
    <section className="text-center pt-2 pb-6 sm:py-8 relative">
      {/* Top Live Pill */}
      <div className="inline-flex items-center gap-2.5 bg-card/80 dark:bg-card/60 backdrop-blur-md border border-border/80 px-4 py-1.5 rounded-full text-xs mb-6 shadow-xs hover:border-primary/40 transition-colors">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500"></span>
        </span>
        {onlineCount !== null && totalVisits !== null ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {onlineCount.toLocaleString()} Live Now
            </span>
            <span className="text-muted-foreground/40 font-light">•</span>
            <span className="text-muted-foreground font-medium">
              {totalVisits.toLocaleString()} visitors
            </span>
          </div>
        ) : (
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500" /> Live Digital Billboard Active
          </span>
        )}
      </div>

      {/* Main Attention-Grabbing Headline */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] text-foreground">
        Claim{' '}
        <span className="relative inline-block px-2">
          <span className="relative z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            #{displayRank}
          </span>
          <span className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl -rotate-1 scale-105 z-0" />
        </span>{' '}
        for{' '}
        <div className="inline-flex items-center gap-1.5 sm:gap-2.5 text-primary align-middle justify-center flex-wrap mt-1 sm:mt-0">
          <button
            type="button"
            onClick={handleDecrease}
            className="inline-flex items-center justify-center size-9 sm:size-11 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:scale-105 active:scale-95 transition-all shadow-xs"
            aria-label="Decrease bid"
          >
            <Minus className="size-4 sm:size-5" />
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
            className="bg-transparent border-none outline-none text-primary text-center font-black text-3xl sm:text-5xl md:text-6xl p-0 focus:ring-0 w-auto min-w-0 drop-shadow-sm"
            size={bidText.length}
          />
          <button
            type="button"
            onClick={handleIncrease}
            className="inline-flex items-center justify-center size-9 sm:size-11 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:scale-105 active:scale-95 transition-all shadow-xs"
            aria-label="Increase bid"
          >
            <Plus className="size-4 sm:size-5" />
          </button>
        </div>
      </h1>

      {/* Subtitle / Value Prop */}
      <p className="text-muted-foreground mt-4 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 leading-relaxed font-normal">
        {displayRank === 1
          ? topBid > 0
            ? `Outbid the current #1 listing ($${topBid}) to dominate the top spot on the billboard.`
            : 'Be the first to claim #1 on the digital billboard starting at just $1.'
          : `A bid of $${bid} secures spot #${displayRank} on the public billboard.`}
      </p>

      {/* Search / Claim Bar */}
      <div className="mt-8 max-w-xl mx-auto px-4">
        <div className="p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-card/90 dark:bg-card/70 border border-border/80 shadow-lg shadow-black/5 dark:shadow-indigo-950/20 backdrop-blur-xl flex flex-col sm:flex-row gap-2 transition-all focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15">
          <div className="relative flex-1 min-w-0 flex items-center">
            {isHandle ? (
              <XIcon className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
            ) : (
              <Globe className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
            )}
            <Input
              ref={ref}
              placeholder="Your product's URL or @handle"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-11 pr-4 h-12 text-sm sm:text-base border-none shadow-none focus-visible:ring-0 bg-transparent rounded-full min-w-0"
            />
          </div>
          <Button
            size="lg"
            className="h-12 px-7 rounded-xl sm:rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shrink-0 shadow-md shadow-indigo-500/25 shimmer-btn hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            onClick={handleClaim}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Redirecting…'
            ) : (
              <>
                Claim Billboard Spot
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-2.5 mt-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-medium">
            {error}
          </div>
        )}

        {/* Value Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-[11px] sm:text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="size-3.5 text-amber-500" /> Instant live ranking
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-500" /> Only pay difference to reclaim
          </span>
        </div>
      </div>
    </section>
  );
});
