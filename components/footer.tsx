'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>
          <span>Digital Billboard · Built by </span>
          <Link
            href="https://x.com/LoharTushal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:underline font-medium"
          >
            Tushal Lohar
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            Leaderboard
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/rules" className="hover:text-foreground transition-colors">
            Rules
          </Link>
        </div>
      </div>
    </footer>
  );
}