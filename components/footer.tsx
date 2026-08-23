'use client';

import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-indigo-500" /> Digital Billboard
            </span>
            <span>·</span>
            <span>
              Built by{' '}
              <Link
                href="https://x.com/LoharTushal"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-4"
              >
                Tushal Lohar
              </Link>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-foreground transition-colors">
              Billboard
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/rules" className="hover:text-foreground transition-colors">
              Rules
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}