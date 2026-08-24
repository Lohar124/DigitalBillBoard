'use client';

import { useState, forwardRef, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Minus, Plus, Loader2, Sparkles, TrendingUp, Zap, Crown, Flame, ArrowUpRight, DollarSign, Layers, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { CATEGORIES, getCategoryById } from '@/lib/categories';
import type { LeaderboardItem } from '@/lib/leaderboard-data';

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
  category: string;
}

export const HeroSection = forwardRef<HTMLInputElement, HeroSectionProps>(function HeroSection(
  { selectedRank, selectedBid, items = [], onBidChange },
  ref
) {
  const topBid = items.length > 0 ? items[0].bid : 0;
  const defaultTopBid = topBid > 0 ? topBid + 1 : 5;

  const [url, setUrl] = useState('');
  const [bid, setBid] = useState(selectedBid || defaultTopBid);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('devtools');
  const [agreedToPolicy, setAgreedToPolicy] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  // Live URL Metadata Preview State
  const [urlPreview, setUrlPreview] = useState<UrlPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const hasTrackedRef = useRef(false);

  // Calculate platform metrics
  const totalVolume = items.reduce((sum, item) => sum + item.bid, 0);
  const totalBidsCount = items.length;

  useEffect(() => {
    let sessionId = '';
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('db_session_id');
      if (!saved) {
        saved = 'v_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        localStorage.setItem('db_session_id', saved);
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
      setBid(Math.max(5, selectedBid));
    } else if (items.length > 0 && bid === 5 && topBid > 0) {
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
            category: data.category || 'devtools',
          });
          if (!customTitle) setCustomTitle(data.title || parsedHostname);
          if (!customDesc) setCustomDesc(data.description || '');
          if (data.category) setSelectedCategory(data.category);
        } else {
          setUrlPreview({
            favicon: `https://www.google.com/s2/favicons?domain=${parsedHostname}&sz=64`,
            title: parsedHostname,
            description: '',
            hostname: parsedHostname,
            category: 'devtools',
          });
        }
      } catch {
        setUrlPreview({
          favicon: `https://www.google.com/s2/favicons?domain=${parsedHostname}&sz=64`,
          title: parsedHostname,
          description: '',
          hostname: parsedHostname,
          category: 'devtools',
        });
      } finally {
        setIsLoadingPreview(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [url]);

  const handleClaim = async () => {
    if (!url.trim()) {
      setError('Enter a website URL or @handle first');
      return;
    }
    if (bid < 5) {
      setError('Minimum starting bid is $5');
      return;
    }
    if (!agreedToPolicy) {
      setError('Please acknowledge that all bids are final and non-refundable');
      return;
    }

    const normalizedUrl = /^https?:\/\//.test(url) ? url : `https://${url.replace(/^@/, '')}`;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          bid,
          name: customTitle || urlPreview?.title,
          description: customDesc || urlPreview?.description,
          category: selectedCategory,
        }),
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
    const newBid = Math.max(5, bid - 1);
    setBid(newBid);
    onBidChange?.(newBid);
  };

  const handleIncrease = () => {
    const newBid = Math.min(100000, bid + 1);
    setBid(newBid);
    onBidChange?.(newBid);
  };

  const applyPreset = (amount: number) => {
    const target = Math.max(5, Math.min(100000, amount));
    setBid(target);
    onBidChange?.(target);
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
  const estimatedClicks = displayRank === 1 ? '1,500 - 3,000' : displayRank <= 3 ? '800 - 1,500' : '200 - 600';

  return (
    <section className="text-center py-4 sm:py-6">
      {/* Live Online Visitors Capsule */}
      <div className="inline-flex items-center gap-2 bg-muted/70 dark:bg-muted/40 border border-border px-3.5 py-1 rounded-full text-xs mb-5 text-muted-foreground">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        {onlineCount !== null && totalVisits !== null ? (
          <span>
            <strong className="text-foreground font-semibold">{onlineCount}</strong> online ·{' '}
            <strong className="text-foreground font-semibold">{totalVisits.toLocaleString()}</strong> visitors since launch
          </span>
        ) : (
          <span>Live billboard active · 2,840+ clicks delivered</span>
        )}
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground flex items-center justify-center gap-2 flex-wrap">
        <span>Claim #{displayRank} for</span>
        <span className="inline-flex items-center gap-1 text-[#f26e5b] dark:text-[#ff7e6c]">
          <button
            type="button"
            onClick={handleDecrease}
            className="inline-flex items-center justify-center size-7 sm:size-8 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Decrease bid"
          >
            <Minus className="size-3" />
          </button>
          <input
            type="text"
            value={bidText}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(num) && num >= 5 && num <= 100000) {
                setBid(num);
                onBidChange?.(num);
              }
            }}
            className="bg-transparent border-none outline-none text-[#f26e5b] dark:text-[#ff7e6c] text-center font-black text-4xl sm:text-6xl p-0 focus:ring-0 w-auto min-w-0"
            size={bidText.length}
          />
          <button
            type="button"
            onClick={handleIncrease}
            className="inline-flex items-center justify-center size-7 sm:size-8 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Increase bid"
          >
            <Plus className="size-3" />
          </button>
        </span>
      </h1>

      {/* Explanatory Subtitle */}
      <p className="text-muted-foreground mt-3 text-xs sm:text-sm max-w-lg mx-auto px-4 leading-relaxed">
        <span className="text-foreground font-semibold">New spots start at $5.</span> Paying less than the #1 price still puts you on the board at whatever place that bid can take.
      </p>

      {/* Main Claim Input Row with Inline Category Dropdown & Outbid Button */}
      <div className="mt-6 max-w-2xl mx-auto px-4 text-left">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* URL Input */}
          <div className="relative flex-1 min-w-0">
            {isLoadingPreview ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
            ) : isHandle ? (
              <XIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            ) : (
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            )}
            <Input
              ref={ref}
              placeholder="Your product URL or @handle"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-11 h-12 text-sm bg-card border-border rounded-2xl shadow-2xs"
            />
          </div>

          {/* Category Dropdown (Right next to input) */}
          <div className="relative shrink-0 sm:w-52">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-12 text-xs sm:text-sm bg-card border border-border rounded-2xl px-3.5 text-foreground appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-foreground shadow-2xs font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Outbid / Claim Button */}
          <Button
            size="lg"
            className="h-12 px-7 rounded-2xl font-bold bg-[#f26e5b] hover:bg-[#e25d4a] text-white transition-all shrink-0 cursor-pointer shadow-sm text-sm"
            onClick={handleClaim}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" /> Redirecting...
              </span>
            ) : (
              'Outbid'
            )}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Already on the list? Enter the same URL or @handle and up your bid.
        </p>

        {/* Live Auto-Scraped Card Preview with Custom Title/Description & Policy Checkbox */}
        {urlPreview && (
          <div className="mt-3.5 p-4 rounded-2xl bg-card border border-border text-left shadow-xs space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  <Image
                    src={urlPreview.favicon}
                    alt={urlPreview.title}
                    width={18}
                    height={18}
                    className="size-4.5 object-contain"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    {customTitle || urlPreview.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate font-mono">
                    {urlPreview.hostname} · <span className="text-amber-500 font-semibold">{getCategoryById(selectedCategory).name}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-foreground">
                  Rank #{displayRank}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {existingListing ? `Pay $${upgradeCost} upgrade` : `$${bid} total`}
                </div>
              </div>
            </div>

            {/* Custom Description */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Brand Title</label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Website or Brand Name"
                    className="h-8 text-xs bg-background rounded-lg border-border mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Tagline / Description</label>
                  <Input
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Short tagline (max 150 chars)"
                    maxLength={150}
                    className="h-8 text-xs bg-background rounded-lg border-border mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Policy Agreement Checkbox */}
            <div className="pt-2 border-t border-border/60">
              <label
                onClick={() => setAgreedToPolicy(!agreedToPolicy)}
                className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                  className="mt-0.5 rounded border-border size-3.5 accent-[#f26e5b] cursor-pointer"
                />
                <span>
                  I understand all bids are <strong className="text-foreground">final and non-refundable</strong> immediately upon placement on the billboard.
                </span>
              </label>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive mt-2 text-center">{error}</p>}
      </div>
    </section>
  );
});
