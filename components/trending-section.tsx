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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-muted-foreground" />
          Trending right now
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No trending listings yet.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.rank} className="flex items-center justify-between text-sm min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${item.name}&sz=32`}
                    alt={item.name}
                    width={16}
                    height={16}
                    className="rounded flex-shrink-0"
                    unoptimized
                  />
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {item.clicks} clicks
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
