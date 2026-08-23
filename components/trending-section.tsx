'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
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
    <Card className="rounded-xl border-border bg-card shadow-2xs">
      <CardHeader className="pb-2.5 pt-3.5 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Flame className="size-3.5 text-muted-foreground" />
          <span>Trending by Clicks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3.5 pt-1">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No trending listings yet.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.rank}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-muted/50 transition-colors gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] text-muted-foreground/70 w-3">
                    {index + 1}
                  </span>
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${item.name}&sz=32`}
                    alt={item.name}
                    width={16}
                    height={16}
                    className="size-4 object-contain rounded-xs shrink-0"
                    unoptimized
                  />
                  <span className="font-medium text-foreground truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  {item.clicks.toLocaleString()} clicks
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
