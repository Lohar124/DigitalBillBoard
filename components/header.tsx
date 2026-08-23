'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles, Trophy } from 'lucide-react';
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
    { name: 'Billboard', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Rules', href: '/rules' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/40 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} className="rounded-lg">
              <Menu className="size-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}
          <Link href="/" className="group flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all flex items-center justify-center">
              <div className="size-full bg-background rounded-[10px] flex items-center justify-center">
                <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="font-extrabold bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
              Digital<span className="text-indigo-600 dark:text-indigo-400 font-black">Billboard</span>
            </span>
          </Link>
        </div>

        <nav className={cn('flex items-center gap-1 sm:gap-2', isMobile && 'hidden')}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="h-4 w-px bg-border/60 mx-1.5" />
          <ThemeToggle />
        </nav>

        {isMobile && <ThemeToggle />}
      </div>
    </header>
  );
}
