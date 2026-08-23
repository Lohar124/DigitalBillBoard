'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Clock, MousePointerClick, Crown, Sparkles, ArrowUpRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LeaderboardItem, MetaData } from '@/lib/leaderboard-data';
import { cn } from '@/lib/utils';

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 font-black flex items-center justify-center text-sm sm:text-base shadow-md shadow-amber-500/25 shrink-0">
        <Crown className="size-5" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-800 text-slate-900 dark:text-slate-100 font-black flex items-center justify-center text-sm sm:text-base shadow-md shadow-slate-500/20 shrink-0">
        #2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 font-black flex items-center justify-center text-sm sm:text-base shadow-md shadow-amber-900/20 shrink-0">
        #3
      </div>
    );
  }
  return (
    <div className="size-9 sm:size-10 rounded-xl bg-muted/80 text-muted-foreground font-bold flex items-center justify-center text-xs sm:text-sm border border-border/60 shrink-0">
      #{rank}
    </div>
  );
}

function getCardBorder(rank: number) {
  if (rank === 1) return 'border-amber-400/60 dark:border-amber-400/40 shadow-md shadow-amber-500/10 bg-gradient-to-r from-amber-500/10 via-card to-card';
  if (rank === 2) return 'border-slate-300/60 dark:border-slate-600/40 bg-gradient-to-r from-slate-400/10 via-card to-card';
  if (rank === 3) return 'border-amber-700/40 dark:border-amber-800/30 bg-gradient-to-r from-amber-800/10 via-card to-card';
  return 'border-border/80 hover:border-primary/40 bg-card/90';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
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
  const description = meta?.description || '';
  const favicon = meta?.favicon || `https://www.google.com/s2/favicons?domain=${item.name}&sz=64`;

  const href = `${item.url}${item.url.includes('?') ? '&' : '?'}utm_source=digitalbillboard&utm_medium=leaderboard&utm_campaign=listings`;

  const handleClick = () => {
    fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: item.url }),
    }).catch(() => {});
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/card relative transition-transform duration-200"
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
            'p-3.5 sm:p-4 rounded-2xl transition-all duration-300 backdrop-blur-md',
            getCardBorder(item.rank),
            'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-indigo-950/20'
          )}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Rank Badge */}
            {getRankBadge(item.rank)}

            {/* Favicon / Logo */}
            <div className="size-10 sm:size-12 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              <Image
                src={favicon}
                alt={item.name}
                width={36}
                height={36}
                className="size-7 sm:size-8 object-contain rounded-sm"
                unoptimized
              />
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-foreground truncate group-hover/card:text-primary transition-colors">
                  {title}
                </span>
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-all shrink-0" />
              </div>
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground/80" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MousePointerClick className="size-3 text-muted-foreground/80" />
                  <span className="font-medium text-foreground/80">{item.clicks.toLocaleString()} clicks</span>
                </div>
              </div>
            </div>

            {/* Bid Amount Pill */}
            <div className="flex-shrink-0 text-right">
              <div className={cn(
                "px-3 py-1.5 rounded-xl font-mono font-bold text-sm sm:text-base border shadow-2xs",
                item.rank === 1
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-muted/80 text-foreground border-border/80"
              )}>
                {formatBid(item.bid)}
              </div>
            </div>
          </div>
        </Card>
      </a>

      {/* Slide-down Outbid Action */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out -mt-1',
          isHovered ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600/10 via-primary/15 to-purple-600/10 hover:from-indigo-600/20 hover:to-purple-600/20 text-primary text-xs sm:text-sm font-bold border border-primary/40 border-t-0 rounded-b-xl py-2.5 shadow-xs transition-all cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClaimClick(item.rank, item.bid + 1);
          }}
        >
          <Sparkles className="size-3.5 text-indigo-500" />
          Outbid & Claim #{item.rank} for {formatBid(item.bid + 1)}
        </button>
      </div>
    </div>
  );
}
