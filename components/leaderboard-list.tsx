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
import { CATEGORIES } from '@/lib/categories';
import { Trophy, Search, Flame, Clock, X, Layers, Filter } from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState('all');
  const prevPage = useRef(currentPage);

  useEffect(() => {
    if (propItems !== undefined) return;
    let cancelled = false;
    fetch(`/api/leaderboard?t=${Date.now()}`, { cache: 'no-store' })
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

  // Filter and Sort items based on search query, category, and active tab
  const filteredAndSortedItems = useMemo(() => {
    let result = [...rawItems];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.url.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    // 25+ Category filter
    if (activeCategory !== 'all') {
      result = result.filter((i) => {
        if (i.category === activeCategory) return true;
        // Fallback keyword matching
        const catDef = CATEGORIES.find((c) => c.id === activeCategory);
        if (catDef) {
          const text = `${i.name} ${i.url} ${i.description || ''}`.toLowerCase();
          return catDef.keywords.some((kw) => text.includes(kw.toLowerCase()));
        }
        return false;
      });
    }

    // Sort by tab
    if (activeTab === 'clicked') {
      result.sort((a, b) => b.clicks - a.clicks);
    } else if (activeTab === 'recent') {
      result.sort((a, b) => (b.time === 'just now' ? 1 : 0) - (a.time === 'just now' ? 1 : 0));
    } else {
      // Top Bids (default)
      result.sort((a, b) => b.bid - a.bid);
    }

    return result;
  }, [rawItems, searchQuery, activeCategory, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedItems, validPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClaimClick = (rank: number, bid: number) => {
    onClaimClick?.(rank, bid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rawItems.length };
    for (const cat of CATEGORIES) {
      counts[cat.id] = rawItems.filter((i) => {
        if (i.category === cat.id) return true;
        const text = `${i.name} ${i.url} ${i.description || ''}`.toLowerCase();
        return cat.keywords.some((kw) => text.includes(kw.toLowerCase()));
      }).length;
    }
    return counts;
  }, [rawItems]);

  return (
    <section className="space-y-4 text-left">
      {/* 25+ Category Filter Navigation Pills (Sticky Horizontal Scroll) */}
      <div className="relative">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
              activeCategory === 'all'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted'
            }`}
          >
            <Layers className="size-3" />
            <span>Global Feed ({categoryCounts['all'] || 0})</span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                  isActive
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1 rounded-full ${
                      isActive ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Search Input & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tools, URLs, keywords..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8.5 pr-8 h-9 text-xs bg-card border-border rounded-xl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sort Tabs */}
        <div className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80 shrink-0 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('top')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'top'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="size-3 text-amber-500" />
            <span>Top Bids</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clicked')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'clicked'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="size-3 text-orange-500" />
            <span>Most Clicked</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'recent'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="size-3 text-blue-500" />
            <span>Recent</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Cards List */}
      <div className="space-y-3 pt-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <LeaderboardCardSkeleton key={i} />
          ))
        ) : paginatedItems.length > 0 ? (
          paginatedItems.map((item) => (
            <LeaderboardCard
              key={item.url}
              item={item}
              onClaimClick={handleClaimClick}
            />
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl p-6 bg-card/40">
            <Trophy className="size-8 text-muted-foreground/50 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-foreground">No listings found in this category</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No tools matched "${searchQuery}". Try a different search.`
                : 'Be the first to claim #1 in this category starting at $1!'}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-3 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(validPage - 1);
                  }}
                  className={validPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === validPage}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(validPage + 1);
                  }}
                  className={validPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
}
