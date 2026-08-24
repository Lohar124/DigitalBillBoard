'use client';

import { useState } from 'react';
import { Mail, Check, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function NewsletterCard() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('You are on the list! Top tools incoming weekly.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to connect. Please try again.');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-muted/40 p-5 sm:p-6 text-left my-8 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="max-w-md">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-2">
            <Sparkles className="size-3" />
            <span>Weekly Builder Digest</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            Get the Top 5 Trending Tools of the Week
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Join 1,200+ founders and tech builders who receive our weekly curated leaderboard highlights. No spam, ever.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full md:w-auto min-w-[280px]">
          {status === 'success' ? (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <Check className="size-4 shrink-0 text-emerald-500" />
              <span>{message}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-10 text-xs bg-background rounded-xl border-border"
                    disabled={status === 'loading'}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="h-10 px-4 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
                >
                  {status === 'loading' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-1">
                      <span>Join Free</span>
                      <ArrowRight className="size-3" />
                    </span>
                  )}
                </Button>
              </div>
              {status === 'error' && (
                <p className="text-[11px] text-destructive pl-1">{message}</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
