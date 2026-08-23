'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LatestActivitySkeleton } from '@/components/latest-activity-skeleton';
import type { LeaderboardItem } from '@/lib/leaderboard-data';

interface LatestActivityProps {
  items?: LeaderboardItem[];
  isLoading?: boolean;
}

export function LatestActivity({ items: propItems, isLoading: propIsLoading }: LatestActivityProps = {}) {
  const [internalLoading, setInternalLoading] = useState(propItems === undefined);
  const [internalItems, setInternalItems] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    if (propItems !== undefined) return;
    let cancelled = false;
    fetch('/api/leaderboard')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && Array.isArray(data.items)) {
          setInternalItems(data.items.slice(0, 5));
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
  const items = propItems !== undefined ? propItems.slice(0, 5) : internalItems;

  if (isLoading) return <LatestActivitySkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex size-1.5 rounded-full bg-primary"></span>
          </span>
          Latest activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No recent activity yet.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.rank} className="flex items-center justify-between text-sm min-w-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${item.name}&sz=32`}
                    alt={item.name}
                    width={16}
                    height={16}
                    className="rounded flex-shrink-0"
                    unoptimized
                  />
                  <span className="font-medium truncate">{item.name}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    #{item.rank}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex-shrink-0">·</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ${item.bid.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
