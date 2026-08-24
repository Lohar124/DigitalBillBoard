'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Clock, MousePointerClick, ArrowUpRight, Share2, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LeaderboardItem, MetaData } from '@/lib/leaderboard-data';
import { cn } from '@/lib/utils';

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center justify-center text-xs border border-amber-500/25 shrink-0">
        #1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="size-8 rounded-lg bg-muted text-foreground/80 font-mono font-semibold flex items-center justify-center text-xs border border-border shrink-0">
        #2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="size-8 rounded-lg bg-muted text-foreground/70 font-mono font-semibold flex items-center justify-center text-xs border border-border shrink-0">
        #3
      </div>
    );
  }
  return (
    <div className="size-8 rounded-lg bg-muted/50 text-muted-foreground font-mono font-medium flex items-center justify-center text-xs border border-border/60 shrink-0">
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
  const [copied, setCopied] = useState(false);
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

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const tweetText = `${title} is currently Rank #${item.rank} with $${item.bid} on @DigitalBillboard! 🚀\n\nCheck it out on https://digitalbillboard.lol`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank', 'noopener,noreferrer');
  };

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
        <Card className="p-3.5 sm:p-4 rounded-xl border-border bg-card hover:bg-muted/40 transition-colors shadow-2xs">
          <div className="flex items-center gap-3 sm:gap-3.5">
            {/* Rank */}
            {getRankBadge(item.rank)}

            {/* Logo */}
            <div className="size-9 sm:size-10 rounded-lg bg-muted/60 border border-border/70 flex items-center justify-center shrink-0 overflow-hidden">
              <Image
                src={favicon}
                alt={item.name}
                width={32}
                height={32}
                className="size-6 object-contain rounded-xs"
                unoptimized
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm sm:text-base text-foreground truncate group-hover/item:text-foreground">
                  {title}
                </span>
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
              </div>
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground/70" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MousePointerClick className="size-3 text-muted-foreground/70" />
                  <span>{item.clicks.toLocaleString()} clicks</span>
                </div>
              </div>
            </div>

            {/* Bid Amount & Quick Share */}
            <div className="flex items-center gap-2 flex-shrink-0 text-right">
              <button
                type="button"
                onClick={handleShareClick}
                title="Share on X"
                className="size-8 rounded-lg border border-border/80 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer"
              >
                <Share2 className="size-3.5" />
              </button>

              <span className="font-mono font-bold text-sm sm:text-base text-foreground min-w-[50px] text-right">
                {formatBid(item.bid)}
              </span>
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
          className="w-full flex items-center justify-center gap-1.5 bg-muted/70 hover:bg-muted text-foreground text-xs font-medium border border-border border-t-0 rounded-b-xl py-2 transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClaimClick(item.rank, item.bid + 1);
          }}
        >
          <span>Claim this spot for {formatBid(item.bid + 1)}</span>
          <span className="text-muted-foreground font-mono">→</span>
        </button>
      </div>
    </div>
  );
}
