'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  const navLinks = [
    { name: 'Leaderboard', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Rules', href: '/rules' },
  ];

  return (
    <header className="w-full border-b border-border/80 bg-background/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} className="rounded-md -ml-2">
              <Menu className="size-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}

          {/* Highlighted & Attractive Digital BillBoard Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-[0.98]"
          >
            {/* Glowing Billboard Icon Emblem */}
            <div className="relative size-8 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-[1px] shadow-sm shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              <div className="size-full bg-background rounded-[11px] flex items-center justify-center relative overflow-hidden">
                {/* Subtle illuminated inner background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-70" />
                
                {/* Glowing LED Billboard Grid SVG Icon */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4.5 text-amber-500 dark:text-amber-400 relative z-10"
                >
                  <rect x="3" y="3" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 8h10M7 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M9 16v5M15 16v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 21h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Wordmark Typography */}
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-base sm:text-lg">
              <span className="text-foreground">Digital</span>
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                BillBoard
              </span>
              <span className="hidden sm:inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </div>
          </Link>
        </div>

        <nav className={cn('flex items-center gap-1 sm:gap-4', isMobile && 'hidden')}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-xs sm:text-sm font-medium transition-colors px-2 py-1 rounded-lg',
                  isActive
                    ? 'text-foreground font-semibold bg-muted/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="h-3.5 w-px bg-border ml-1 mr-0.5" />
          <ThemeToggle />
        </nav>

        {isMobile && <ThemeToggle />}
      </div>
    </header>
  );
}
