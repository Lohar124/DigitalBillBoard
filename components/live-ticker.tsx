'use client';

import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Sparkles, X, ArrowUpRight, Flame } from 'lucide-react';
import type { LeaderboardItem } from '@/lib/leaderboard-data';

interface LiveTickerProps {
  items?: LeaderboardItem[];
}

const LOCATIONS = ['San Francisco', 'London', 'Berlin', 'Tokyo', 'New York', 'Singapore', 'Toronto', 'Paris', 'Sydney', 'Bengaluru'];

export function LiveTicker({ items = [] }: LiveTickerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);

  const topItems = items.slice(0, 5);

  useEffect(() => {
    if (isDismissed) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setEventIndex((prev) => prev + 1);
        setIsVisible(true);
      }, 400);
    }, 7000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  if (isDismissed) return null;

  // Generate dynamic contextual events based on actual items
  const location = LOCATIONS[eventIndex % LOCATIONS.length];
  const item = topItems.length > 0 ? topItems[eventIndex % topItems.length] : null;

  let content = null;
  const eventType = eventIndex % 3;

  if (eventType === 0 && item) {
    content = (
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-muted-foreground">
          Someone in <strong className="text-foreground font-medium">{location}</strong> checked out{' '}
          <span className="text-foreground font-semibold">{item.name}</span> (#{item.rank})
        </span>
      </div>
    );
  } else if (eventType === 1 && item) {
    content = (
      <div className="flex items-center gap-2">
        <Flame className="size-3.5 text-amber-500 shrink-0" />
        <span className="text-muted-foreground">
          <strong className="text-foreground font-semibold">{item.name}</strong> has generated{' '}
          <strong className="text-foreground font-semibold font-mono">{item.clicks.toLocaleString()}</strong> clicks
        </span>
      </div>
    );
  } else {
    content = (
      <div className="flex items-center gap-2">
        <TrendingUp className="size-3.5 text-blue-500 shrink-0" />
        <span className="text-muted-foreground">
          Top spot is holding strong at{' '}
          <strong className="text-foreground font-semibold font-mono">${topItems[0]?.bid || 1}</strong>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 max-w-xs sm:max-w-sm transition-all duration-400 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5 bg-card/95 backdrop-blur-md border border-border px-3.5 py-2 rounded-xl shadow-lg text-xs">
        <div className="min-w-0 flex-1 truncate">{content}</div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-muted-foreground hover:text-foreground size-4 rounded flex items-center justify-center shrink-0 cursor-pointer"
          title="Dismiss"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}
