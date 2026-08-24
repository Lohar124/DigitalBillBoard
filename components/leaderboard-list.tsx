'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { LeaderboardCard } from '@/components/leaderboard-card';
import { LeaderboardCardSkeleton } from '@/components/leaderboard-card-skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { LeaderboardItem } from '@/lib/leaderboard-data';
import { Trophy, Search, Flame, Clock, TrendingUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 10;
type FilterTab = 'top' | 'clicked' | 'recent';

interface LeaderboardListProps {
  onClaimClick?: (rank: number, bid: number) => void;
  items?: LeaderboardItem[];
  isLoading?: boolean;
}

export function LeaderboardList({ onClaimClick, items: propItems, isLoading: propIsLoading }: LeaderboardListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [internalLoading, setInternalLoading] = useState(propItems === undefined);
  const [internalItems, setInternalItems] = useState<LeaderboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('top');
  const prevPage = useRef(currentPage);

  useEffect(() => {
    if (propItems !== undefined) return;
    let cancelled = false;
    fetch('/api/leaderboard')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setInternalItems(Array.isArray(data.items) ? data.items : []);
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

  // Filter and Sort items based on search query and active tab
  const filteredAndSortedItems = useMemo(() => {
    let result = [...rawItems];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.url.toLowerCase().includes(q)
      );
    }

    // Sort by tab
    if (activeTab === 'clicked') {
      result.sort((a, b) => b.clicks - a.clicks);
    } else if (activeTab === 'recent') {
      // Recent order: by reverse original rank or recent activity
      result.sort((a, b) => (b.time === 'just now' ? 1 : 0) - (a.time === 'just now' ? 1 : 0));
    } else {
      // Default: Top bids
      result.sort((a, b) => b.bid - a.bid);
    }

    return result;
  }, [rawItems, searchQuery, activeTab]);

  // Reset page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredAndSortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const [isPageChanging, setIsPageChanging] = useState(false);

  useEffect(() => {
    if (prevPage.current !== currentPage) {
      setIsPageChanging(true);
      const timer = setTimeout(() => setIsPageChanging(false), 200);
      prevPage.current = currentPage;
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  const handleClaimClick = (rank: number, bid: number) => {
    if (onClaimClick) {
      onClaimClick(rank, bid);
    }
  };

  return (
    <div>
      {/* Section Header & Search / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>Leaderboard</span>
            <span className="text-xs font-mono font-normal text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full border border-border">
              {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'listing' : 'listings'}
            </span>
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('top')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'top'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="size-3" />
            <span>Top Bids</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clicked')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'clicked'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="size-3" />
            <span>Most Clicked</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'recent'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="size-3" />
            <span>Recent</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3.5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search listings by name or domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-9 text-xs bg-card border-border rounded-xl"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Listings List */}
      <div className="space-y-2.5 sm:space-y-3">
        {isLoading || isPageChanging ? (
          Array.from({ length: 3 }).map((_, i) => (
            <LeaderboardCardSkeleton key={i} />
          ))
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-14 px-4 border border-dashed rounded-xl border-border bg-card">
            <div className="inline-flex size-10 rounded-full bg-muted items-center justify-center mb-3 text-muted-foreground">
              {searchQuery ? <Search className="size-5" /> : <Trophy className="size-5" />}
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {searchQuery ? `No results for "${searchQuery}"` : 'No listings on the board yet'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try searching with a different domain or clear the search query.'
                : 'Be the first to claim #1 on the leaderboard using the form above.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg border border-border transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          currentItems.map((item) => (
            <LeaderboardCard key={item.rank} item={item} onClaimClick={handleClaimClick} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
