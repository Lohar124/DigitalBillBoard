'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
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
    <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>Latest Activity</span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Activity className="size-3 text-emerald-500" /> Real-time feed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 pb-4">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No recent activity yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between text-sm p-2 rounded-xl hover:bg-muted/50 transition-colors gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                  <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 h-4 rounded-md border-border/80 text-muted-foreground shrink-0">
                    #{item.rank}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    ${item.bid.toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
