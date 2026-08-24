'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trophy, Share2, Check, X, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface ClaimSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  name?: string;
  rank?: number;
  bidAmount?: number;
  isSponsor?: boolean;
  slotNumber?: number;
}

export function ClaimSuccessModal({
  isOpen,
  onClose,
  url,
  name,
  rank,
  bidAmount,
  isSponsor,
  slotNumber,
}: ClaimSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  let hostname = url;
  try {
    hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {}

  const displayName = name || hostname;
  const siteDomain = 'digitalbillboard.lol';

  // Tweet text generation
  const tweetText = isSponsor
    ? `We just claimed Sponsor Slot #${slotNumber || 1} on @DigitalBillboard! 🚀\n\nCheck out ${displayName} on https://${siteDomain}`
    : `We just claimed ${rank ? `Rank #${rank}` : 'a top spot'} on the @DigitalBillboard! 🏆🚀\n\nCheck out ${displayName} live: https://${siteDomain}`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${siteDomain}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Badge / Trophy */}
        <div className="inline-flex size-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center mb-4 text-amber-500 mx-auto">
          <Trophy className="size-7 animate-bounce" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {isSponsor ? 'Sponsor Slot Claimed!' : 'Spot Claimed Successfully!'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
          {displayName} is now live and featured on Digital Billboard.
        </p>

        {/* Preview Card */}
        <div className="my-5 p-4 rounded-xl bg-muted/50 border border-border text-left flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 overflow-hidden">
              <Image
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                alt={displayName}
                width={20}
                height={20}
                className="size-5 object-contain"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-foreground truncate">{displayName}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{url}</div>
            </div>
          </div>

          <div className="text-right shrink-0">
            {isSponsor ? (
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Slot #{slotNumber}
              </span>
            ) : rank ? (
              <span className="text-xs font-mono font-bold text-foreground bg-card px-2 py-0.5 rounded border border-border">
                #{rank}
              </span>
            ) : null}
            {bidAmount ? (
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                ${bidAmount.toLocaleString()}
              </div>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          {/* Share on X */}
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Share2 className="size-4" />
            <span>Share on X (Twitter)</span>
          </a>

          {/* Copy Billboard Link */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full h-10 rounded-xl text-xs font-medium cursor-pointer"
          >
            {copied ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Copied link!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Copy Billboard Link
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
