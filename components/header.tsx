'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
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
    <header className="w-full border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} className="rounded-md -ml-2">
              <Menu className="size-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity">
            <div className="size-5 rounded-md bg-foreground text-background flex items-center justify-center font-mono text-xs font-bold">
              B
            </div>
            <span>Digital Billboard</span>
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
                  'text-xs sm:text-sm font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
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
