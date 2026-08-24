'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Clock, MousePointerClick, ArrowUpRight, Share2, Flame, Crown, Sparkles, DollarSign, Tag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LeaderboardItem, MetaData } from '@/lib/leaderboard-data';
import { getCategoryById } from '@/lib/categories';
import { cn } from '@/lib/utils';

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-black flex items-center justify-center text-xs sm:text-sm border border-amber-500/50 shrink-0 shadow-md shadow-amber-500/15 relative">
        <Crown className="size-4 absolute -top-2 -right-1.5 text-amber-500 fill-amber-500 drop-shadow-xs" />
        #1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-slate-300/30 via-slate-400/20 to-slate-200/10 text-slate-700 dark:text-slate-200 font-mono font-extrabold flex items-center justify-center text-xs sm:text-sm border border-slate-400/40 shrink-0 shadow-2xs">
        #2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-amber-800/20 via-orange-900/15 to-amber-700/10 text-amber-700 dark:text-amber-300 font-mono font-extrabold flex items-center justify-center text-xs sm:text-sm border border-amber-700/30 shrink-0 shadow-2xs">
        #3
      </div>
    );
  }
  return (
    <div className="size-8 sm:size-9 rounded-xl bg-muted/60 text-muted-foreground font-mono font-semibold flex items-center justify-center text-xs border border-border/70 shrink-0">
      #{rank}
    </div>
  );
}

function formatBid(amount: number) {
  return `$${amount.toLocaleString()}`;
}

interface LeaderboardCardProps {
  item: LeaderboardItem;
  onClaimClick: (rank: number, bid: number) => void;
}

export function LeaderboardCard({ item, onClaimClick }: LeaderboardCardProps) {
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [reactions, setReactions] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [clickCount, setClickCount] = useState(item.clicks);
  const [justClicked, setJustClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setClickCount(item.clicks);
  }, [item.clicks]);

  useEffect(() => {
    // Read local reactions from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`react_${item.url}`);
      if (stored) {
        setHasReacted(true);
        setReactions(Number(stored) || 1);
      }
    }

    const fetchMeta = async () => {
      try {
        const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(item.url)}`);
        if (res.ok) {
          const data = await res.json();
          setMeta(data);
        }
      } catch {}
    };
    fetchMeta();
  }, [item.url]);

  const title = meta?.title || item.name;
  const description = item.description || meta?.description || '';
  const favicon = meta?.favicon || `https://www.google.com/s2/favicons?domain=${item.name}&sz=64`;
  const categoryId = item.category || meta?.category || 'other';
  const categoryDef = getCategoryById(categoryId);

  const href = `${item.url}${item.url.includes('?') ? '&' : '?'}utm_source=digitalbillboard&utm_medium=leaderboard&utm_campaign=listings`;

  const handleClick = () => {
    // 1. Optimistic UI update
    setClickCount((c) => c + 1);
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 1500);

    // 2. Guaranteed server record with keepalive
    try {
      fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const tweetText = `${title} is currently Rank #${item.rank} on @DigitalBillboard with $${item.bid} spent! 🚀\n\nCheck it out on https://digitalbillboard.lol`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleReaction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = reactions + 1;
    setReactions(next);
    setHasReacted(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`react_${item.url}`, String(next));
    }
  };

  const isChampion = item.rank === 1;
  const isSilver = item.rank === 2;
  const isBronze = item.rank === 3;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/item relative"
    >
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="block"
        onClick={handleClick}
      >
        <Card
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl transition-all duration-200 shadow-2xs relative overflow-hidden',
            isChampion
              ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/[0.06] via-card to-amber-500/[0.03] hover:border-amber-500/70 shadow-md shadow-amber-500/5'
              : isSilver
              ? 'border-slate-400/30 bg-gradient-to-r from-slate-400/[0.04] via-card to-transparent hover:border-slate-400/50'
              : isBronze
              ? 'border-amber-700/30 bg-gradient-to-r from-amber-700/[0.03] via-card to-transparent hover:border-amber-700/50'
              : 'border-border bg-card hover:bg-muted/40'
          )}
        >
          {/* Top Glow Accent Bar for Podium Spots */}
          {isChampion && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
          )}
          {isSilver && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 opacity-60" />
          )}
          {isBronze && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-700 via-amber-800 to-amber-700 opacity-50" />
          )}

          <div className="flex items-center gap-3 sm:gap-3.5">
            {/* Podium Rank Badge */}
            {getRankBadge(item.rank)}

            {/* Logo */}
            <div className="size-10 sm:size-11 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              <Image
                src={favicon}
                alt={item.name}
                width={36}
                height={36}
                className="size-6 object-contain rounded-xs"
                unoptimized
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-foreground truncate">
                  {title}
                </span>

                {isChampion && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0 flex items-center gap-1">
                    <Sparkles className="size-2.5" /> #1 Champion
                  </span>
                )}

                {/* Category Tag Pill */}
                {categoryDef && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full border border-border/80 shrink-0 flex items-center gap-1">
                    <span>{categoryDef.icon}</span>
                    <span className="hidden xs:inline truncate max-w-[110px]">{categoryDef.name}</span>
                  </span>
                )}

                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
              </div>

              {description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-normal leading-relaxed">
                  {description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="size-3 text-muted-foreground/70" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <MousePointerClick className={cn('size-3 text-muted-foreground/70 transition-transform', justClicked && 'scale-125 text-emerald-500')} />
                  <span className={cn('transition-colors', justClicked && 'text-emerald-600 dark:text-emerald-400 font-semibold')}>
                    {clickCount.toLocaleString()} clicks
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Actions, Exact Spend & Outbid Button */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 text-right">
              {/* Fire Reaction Button */}
              <button
                type="button"
                onClick={handleReaction}
                title="Fire Reaction"
                className={cn(
                  'h-8 px-2 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer',
                  hasReacted
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover/item:opacity-100 sm:opacity-100'
                )}
              >
                <Flame className={cn('size-3.5', hasReacted ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-muted-foreground')} />
                {reactions > 0 && <span className="font-mono text-[11px]">{reactions}</span>}
              </button>

              {/* Quick Share to X */}
              <button
                type="button"
                onClick={handleShareClick}
                title="Share on X"
                className="size-8 rounded-lg border border-border/80 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer hidden sm:flex"
              >
                <Share2 className="size-3.5" />
              </button>

              {/* Exact Spend Badge */}
              <div className="flex flex-col items-end">
                <span className={cn(
                  'font-mono font-bold text-sm sm:text-base px-2.5 py-0.5 rounded-lg border border-border/60 bg-muted/40',
                  isChampion ? 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 font-extrabold' : 'text-foreground'
                )}>
                  {formatBid(item.bid)}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground mt-0.5">spent</span>
              </div>
            </div>
          </div>
        </Card>
      </a>

      {/* Outbid Drawer */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out -mt-1',
          isHovered ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 bg-muted/80 hover:bg-muted text-foreground text-xs font-semibold border border-border border-t-0 rounded-b-2xl py-2 transition-colors cursor-pointer shadow-2xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClaimClick(item.rank, item.bid + 1);
          }}
        >
          <span>Outbid & Take Rank #{item.rank} for {formatBid(item.bid + 1)}</span>
          <span className="text-muted-foreground font-mono">→</span>
        </button>
      </div>
    </div>
  );
}
