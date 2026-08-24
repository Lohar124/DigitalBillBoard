'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, X, Loader2, Globe } from 'lucide-react';
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
      <div className="group relative rounded-xl border border-border bg-card p-3.5 hover:border-foreground/30 transition-colors flex flex-col justify-between gap-2 shadow-2xs w-full text-left">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="size-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
            <img
              src={logoSrc}
              alt={slot.name || hostname}
              className="size-5 object-contain rounded-xs"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://avatar.vercel.sh/' + hostname;
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="font-semibold text-xs text-foreground truncate">
                {slot.name || hostname}
              </h4>
              <span className="shrink-0 text-[9px] font-mono font-medium text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded border border-border">
                SPONSOR
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
              {slot.description || `Visit ${hostname} for more details.`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px]">
          <span className="font-mono text-muted-foreground text-[10px]">
            {slot.days_left ? `${slot.days_left}d left` : '30d left'}
          </span>
          <a
            href={slot.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            visit <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }

  // Available Empty Slot
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 hover:bg-card hover:border-foreground/30 p-3 transition-colors flex items-center justify-between gap-3 group w-full">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-8 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
          <Plus className="size-3.5" />
        </div>

        <div className="min-w-0">
          <h4 className="font-medium text-xs text-foreground truncate">
            Sponsor Slot #{slot.slot_number}
          </h4>
          <p className="text-[10px] font-mono text-muted-foreground">
            $49 · 30 days
          </p>
        </div>
      </div>

      {/* Claim Button */}
      <button
        type="button"
        onClick={() => onClaim(slot.slot_number)}
        className="text-xs font-medium text-foreground bg-muted hover:bg-muted/80 border border-border px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
      >
        Claim
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
    fetch(`/api/sponsors?t=${Date.now()}`, { cache: 'no-store' })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5">
          <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded border border-border inline-block mb-2">
            Sponsor Placement #{selectedSlot}
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">Claim Slot #{selectedSlot}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Featured in the sidebar for 30 consecutive days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Website URL</span>
              {isFetchingMeta && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-normal">
                  <Loader2 className="size-3 animate-spin" /> Auto-fetching info...
                </span>
              )}
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                required
                placeholder="https://yourproduct.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="pl-9 text-sm rounded-xl h-10"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Product / Company Name
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Acme AI"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm rounded-xl h-10"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Tagline / Description (Max 140 chars)
            </label>
            <Input
              type="text"
              required
              maxLength={140}
              placeholder="e.g. Build controllable bots in seconds."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm rounded-xl h-10"
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-xl bg-muted/60 border border-border p-3 flex items-center justify-between text-xs sm:text-sm">
            <div>
              <div className="font-semibold text-foreground">30 Days Placement</div>
              <div className="text-muted-foreground text-xs">Sidebar Slot #{selectedSlot}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-foreground font-mono">
                $49.00
              </div>
              <div className="text-[10px] text-muted-foreground">one-time</div>
            </div>
          </div>

          {errorMessage && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition-opacity cursor-pointer text-xs sm:text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Redirecting...
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
