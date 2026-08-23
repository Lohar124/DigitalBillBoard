'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Sparkles, X, Loader2, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SponsorSlotItem {
  slot_number: number;
  url: string | null;
  name: string | null;
  description: string | null;
  logo_url: string | null;
  claimed_at: string | null;
  expires_at: string | null;
  days_left: number | null;
  is_active: boolean;
  price: number;
  duration_days: number;
}

interface SponsorSlotCardProps {
  slot: SponsorSlotItem;
  onClaim: (slotNumber: number) => void;
}

export function SponsorSlotCard({ slot, onClaim }: SponsorSlotCardProps) {
  if (slot.is_active && slot.url) {
    let hostname = '';
    try {
      hostname = new URL(slot.url).hostname;
    } catch {}

    const logoSrc =
      slot.logo_url ||
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

    return (
      <div className="group relative rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-card/90 dark:bg-card/70 p-3.5 sm:p-4 hover:border-amber-500/60 hover:shadow-md hover:shadow-amber-500/10 transition-all flex flex-col justify-between gap-2.5 shadow-xs w-full text-left backdrop-blur-md">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="size-10 rounded-xl bg-muted/80 border border-border/80 flex items-center justify-center shrink-0 overflow-hidden mt-0.5 shadow-2xs">
            <img
              src={logoSrc}
              alt={slot.name || hostname}
              className="size-6 object-contain rounded-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://avatar.vercel.sh/' + hostname;
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {slot.name || hostname}
              </h4>
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                SPONSOR
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mt-1 leading-snug">
              {slot.description || `Visit ${hostname} for more details.`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
          <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-500"></span>
            {slot.days_left ? `${slot.days_left}d left` : '30d left'}
          </span>
          <a
            href={slot.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono font-medium text-muted-foreground hover:text-foreground transition-colors group-hover:text-primary"
          >
            visit <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }

  // Available Empty Slot
  return (
    <div className="rounded-2xl border border-dashed border-border/90 dark:border-border/60 bg-card/40 hover:bg-card/80 hover:border-amber-500/50 p-3.5 sm:p-4 transition-all flex items-center justify-between gap-3 group w-full backdrop-blur-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Plus Icon Box */}
        <div className="size-9 sm:size-10 rounded-xl border border-dashed border-border/90 flex items-center justify-center text-muted-foreground/70 group-hover:text-amber-500 group-hover:border-amber-500/50 group-hover:scale-105 transition-all shrink-0">
          <Plus className="size-4" />
        </div>

        <div className="min-w-0">
          <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            Slot #{slot.slot_number}
          </h4>
          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
            $49 · 30 days
          </p>
        </div>
      </div>

      {/* Claim Button */}
      <button
        type="button"
        onClick={() => onClaim(slot.slot_number)}
        className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0"
      >
        Claim
        <ArrowRight className="size-3" />
      </button>
    </div>
  );
}

export function useSponsorSlots() {
  const [slots, setSlots] = useState<SponsorSlotItem[]>(
    Array.from({ length: 10 }, (_, i) => ({
      slot_number: i + 1,
      url: null,
      name: null,
      description: null,
      logo_url: null,
      claimed_at: null,
      expires_at: null,
      days_left: null,
      is_active: false,
      price: 49,
      duration_days: 30,
    }))
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchSponsors = () => {
    fetch('/api/sponsors')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data?.slots)) {
          setSlots(data.slots);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  return { slots, isLoading, refreshSponsors: fetchSponsors };
}

export function ClaimSponsorModal({
  selectedSlot,
  onClose,
}: {
  selectedSlot: number | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSlot !== null) {
      setUrl('');
      setName('');
      setDescription('');
      setErrorMessage(null);
    }
  }, [selectedSlot]);

  if (selectedSlot === null) return null;

  const handleUrlBlur = async () => {
    if (!url || !url.includes('.')) return;
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
      setUrl(validUrl);
    }

    try {
      setIsFetchingMeta(true);
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(validUrl)}`);
      if (res.ok) {
        const meta = await res.json();
        if (meta.title && !name) setName(meta.title);
        if (meta.description && !description) setDescription(meta.description.slice(0, 140));
      }
    } catch {
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let validUrl = url.trim();
    if (!validUrl) {
      setErrorMessage('Please enter your website URL');
      return;
    }
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }

    try {
      new URL(validUrl);
    } catch {
      setErrorMessage('Please enter a valid URL');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sponsor',
          slot_number: selectedSlot,
          url: validUrl,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to start sponsor checkout');
      }

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card/95 border border-border/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground size-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 mb-3">
            <Sparkles className="size-3.5" />
            Billboard Sponsor Slot #{selectedSlot}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-foreground">Claim Slot #{selectedSlot}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Your website or brand will be featured in Billboard Slot #{selectedSlot} for 30 consecutive days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Website URL</span>
              {isFetchingMeta && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-normal">
                  <Loader2 className="size-3 animate-spin text-primary" /> Auto-fetching details...
                </span>
              )}
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                required
                placeholder="https://yourproduct.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="pl-10 text-sm rounded-xl h-11 bg-muted/40 border-border/80"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Product / Company Name
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Acme AI or SolveBase"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm rounded-xl h-11 bg-muted/40 border-border/80"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Tagline / Description (Max 140 chars)
            </label>
            <Input
              type="text"
              required
              maxLength={140}
              placeholder="e.g. Build controllable bots in seconds."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm rounded-xl h-11 bg-muted/40 border-border/80"
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-2xl bg-muted/60 border border-border/80 p-4 flex items-center justify-between text-xs sm:text-sm">
            <div>
              <div className="font-bold text-foreground">30 Days Featured Placement</div>
              <div className="text-muted-foreground text-xs">Tower Slot #{selectedSlot}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                $49.00
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">one-time payment</div>
            </div>
          </div>

          {errorMessage && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-sm transition-all shadow-md shadow-amber-500/20 shimmer-btn cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Redirecting to Checkout...
              </span>
            ) : (
              `Pay $49 to Claim Slot #${selectedSlot}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
