'use client';

import { useState, forwardRef, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Minus, Plus } from 'lucide-react';

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

  // Prevents React dev mode double-firing page view increment
  const hasTrackedRef = useRef(false);

  // Real-time visitor presence heartbeat with persistent unique browser token
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

  // Sync default bid when items load if user hasn't selected a custom bid
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

  // Calculate what rank this bid amount will achieve on the board
  const calculatedRank =
    items.length > 0 ? items.filter((i) => i.bid >= bid).length + 1 : 1;
  const displayRank = selectedRank || calculatedRank;
  const bidText = `$${bid.toLocaleString()}`;
  const isHandle = url.startsWith('@');

  return (
    <section className="text-center overflow-hidden">
      <div className="inline-flex items-center gap-2 bg-muted/60 dark:bg-muted/40 border border-border/40 px-3.5 py-1.5 rounded-full text-xs mb-6 min-h-[30px]">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
        </span>
        {onlineCount !== null && totalVisits !== null ? (
          <>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {onlineCount.toLocaleString()} online
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground font-normal">
              {totalVisits.toLocaleString()} visitors since launch
            </span>
          </>
        ) : (
          <span className="text-muted-foreground font-normal">Live board active</span>
        )}
      </div>
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
        Claim #{displayRank} for{' '}
        <div className="inline-flex items-center gap-1 sm:gap-2 text-primary align-middle justify-center flex-wrap">
          <button
            type="button"
            onClick={handleDecrease}
            className="inline-flex items-center justify-center size-8 sm:size-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
          >
            <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
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
            className="bg-transparent border-none outline-none text-primary text-center font-bold text-3xl sm:text-5xl md:text-6xl p-0 focus:ring-0 w-auto min-w-0"
            size={bidText.length}
          />
          <button
            type="button"
            onClick={handleIncrease}
            className="inline-flex items-center justify-center size-8 sm:size-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </h1>
      <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-3xl mx-auto px-4">
        {displayRank === 1
          ? topBid > 0
            ? `Beat the current #1 bid ($${topBid}) to take the top spot on the board.`
            : 'Be the first to claim #1 on the leaderboard starting at $1.'
          : `A bid of $${bid} will secure spot #${displayRank} on the leaderboard.`}
      </p>

      <div className="mt-8 max-w-lg mx-auto px-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            {isHandle ? (
              <XIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            ) : (
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
            <Input
              ref={ref}
              placeholder="Your product's URL or @handle"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-11 h-12 text-base rounded-full min-w-0"
            />
          </div>
          <Button
            size="lg"
            className="h-12 px-8 rounded-full shrink-0"
            onClick={handleClaim}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Redirecting…' : 'Claim'}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        <p className="text-xs text-muted-foreground mt-2">
          Already on the list? Enter the same URL or @handle and up your bid — you only pay the
          difference.
        </p>
      </div>
    </section>
  );
});
