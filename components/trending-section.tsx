'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp } from 'lucide-react';
import { TrendingSkeleton } from '@/components/trending-skeleton';
import type { LeaderboardItem } from '@/lib/leaderboard-data';

interface TrendingSectionProps {
  items?: LeaderboardItem[];
  isLoading?: boolean;
}

export function TrendingSection({ items: propItems, isLoading: propIsLoading }: TrendingSectionProps = {}) {
  const [internalLoading, setInternalLoading] = useState(propItems === undefined);
  const [internalItems, setInternalItems] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    if (propItems !== undefined) return;
    let cancelled = false;
    fetch('/api/leaderboard')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && Array.isArray(data.items)) {
          const sorted = [...data.items].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
          setInternalItems(sorted);
        }
      })
      .catch(() => {
        if (!cancelled) setInternalItems([]);
      })
      .finally(() => {
        if (!cancelled) setInternalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [propItems]);

  const isLoading = propIsLoading !== undefined ? propIsLoading : internalLoading;
  const rawItems = propItems !== undefined ? propItems : internalItems;
  const items = [...rawItems].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  if (isLoading) return <TrendingSkeleton />;

  return (
    <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <div className="size-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Flame className="size-4 animate-pulse" />
            </div>
            <span>Trending Right Now</span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="size-3 text-orange-500" /> By Clicks
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 pb-4">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No trending listings yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.rank}
                className="flex items-center justify-between text-sm p-2 rounded-xl hover:bg-muted/50 transition-colors gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-muted-foreground/60 w-3">
                    {index + 1}
                  </span>
                  <div className="size-6 rounded-md bg-muted/70 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                    <Image
                      src={`https://www.google.com/s2/favicons?domain=${item.name}&sz=32`}
                      alt={item.name}
                      width={16}
                      height={16}
                      className="size-4 object-contain rounded-xs"
                      unoptimized
                    />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                    {item.name}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0"
                >
                  {item.clicks.toLocaleString()} clicks
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
