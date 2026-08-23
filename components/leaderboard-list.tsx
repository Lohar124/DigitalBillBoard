'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Trophy } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface LeaderboardListProps {
  onClaimClick?: (rank: number, bid: number) => void;
  items?: LeaderboardItem[];
  isLoading?: boolean;
}

export function LeaderboardList({ onClaimClick, items: propItems, isLoading: propIsLoading }: LeaderboardListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [internalLoading, setInternalLoading] = useState(propItems === undefined);
  const [internalItems, setInternalItems] = useState<LeaderboardItem[]>([]);
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
  const items = propItems !== undefined ? propItems : internalItems;
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-3 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Leaderboard
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {items.length} listings
        </span>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {isLoading || isPageChanging ? (
          Array.from({ length: 3 }).map((_, i) => (
            <LeaderboardCardSkeleton key={i} />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed rounded-xl border-border bg-card">
            <div className="inline-flex size-10 rounded-full bg-muted items-center justify-center mb-3 text-muted-foreground">
              <Trophy className="size-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No listings on the board yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Be the first to claim #1 on the leaderboard using the form above.
            </p>
          </div>
        ) : (
          currentItems.map((item) => (
            <LeaderboardCard key={item.rank} item={item} onClaimClick={handleClaimClick} />
          ))
        )}
      </div>

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
