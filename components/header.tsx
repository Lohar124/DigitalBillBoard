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

  return (
    <header className="py-3">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
              <Menu />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}
          <Link href="/" className="font-bold text-xl tracking-tight">
            Everybid
          </Link>
        </div>
        <nav className={cn('flex items-center gap-4', isMobile && 'hidden')}>
          <Link
            href="/"
            className={cn(
              'text-sm transition-colors',
              pathname === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Leaderboard
          </Link>
          <Link
            href="/about"
            className={cn(
              'text-sm transition-colors',
              pathname === '/about'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            About
          </Link>
          <Link
            href="/rules"
            className={cn(
              'text-sm transition-colors',
              pathname === '/rules'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Rules
          </Link>
          <ThemeToggle />
        </nav>
        {isMobile && <ThemeToggle />}
      </div>
    </header>
  );
}
