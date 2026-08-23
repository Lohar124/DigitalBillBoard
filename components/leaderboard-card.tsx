'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Clock, MousePointerClick } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LeaderboardItem, MetaData } from '@/lib/leaderboard-data';

function getRankStyle(rank: number) {
  if (rank === 1) return 'bg-amber-500/10 text-amber-600 ring-2 ring-amber-500/30';
  if (rank === 2) return 'bg-gray-400/10 text-gray-500 ring-2 ring-gray-400/30';
  if (rank === 3) return 'bg-orange-600/10 text-orange-700 ring-2 ring-orange-600/30';
  return 'bg-muted text-muted-foreground';
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
  const favicon = meta?.favicon || `https://www.google.com/s2/favicons?domain=${item.name}&sz=32`;

  const href = `${item.url}${item.url.includes('?') ? '&' : '?'}utm_source=everybid&utm_medium=leaderboard&utm_campaign=listings`;

  const handleClick = () => {
    fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: item.url }),
    }).catch(() => {});
  };

  if (isMobile) {
    return (
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a href={href} target="_blank" rel="sponsored noopener noreferrer" className="block group" onClick={handleClick}>
          <Card className="p-3 transition-colors hover:bg-muted/50">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${getRankStyle(item.rank)}`}
                >
                  #{item.rank}
                </div>
                <Image
                  src={favicon}
                  alt={item.name}
                  width={32}
                  height={32}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">{title}</div>
                  <div className="text-lg font-bold flex-shrink-0">{formatBid(item.bid)}</div>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{item.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    <span>{item.clicks.toLocaleString()} clicks</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </a>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out -mt-px ${isHovered ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div
            className="flex items-center justify-center bg-primary/10 text-primary text-sm font-medium cursor-pointer border border-primary/60 border-t-0 rounded-b-lg py-3"
            onClick={() => onClaimClick(item.rank, item.bid + 1)}
          >
            Claim this listing for {formatBid(item.bid + 1)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a href={href} target="_blank" rel="sponsored noopener noreferrer" className="block group" onClick={handleClick}>
        <Card className="p-4 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${getRankStyle(item.rank)}`}
            >
              #{item.rank}
            </div>
            <Image
              src={favicon}
              alt={item.name}
              width={48}
              height={48}
              className="rounded-lg flex-shrink-0"
              unoptimized
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{title}</div>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  <span>{item.clicks.toLocaleString()} clicks</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold">{formatBid(item.bid)}</div>
            </div>
          </div>
        </Card>
      </a>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out -mt-px ${isHovered ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div
          className="flex items-center justify-center bg-primary/10 text-primary text-sm font-medium cursor-pointer border border-primary/60 border-t-0 rounded-b-lg py-3"
          onClick={() => onClaimClick(item.rank, item.bid + 1)}
        >
          Claim this listing for {formatBid(item.bid + 1)}
        </div>
      </div>
    </div>
  );
}
