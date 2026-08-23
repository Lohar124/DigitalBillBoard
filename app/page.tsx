"use client"

import { useRef, useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { TrendingSection } from "@/components/trending-section"
import { LatestActivity } from "@/components/latest-activity"
import {
  SponsorSlotCard,
  useSponsorSlots,
  ClaimSponsorModal,
} from "@/components/sponsors-section"
import { LeaderboardList } from "@/components/leaderboard-list"
import { Footer } from "@/components/footer"
import { MobileLayout } from "@/components/mobile-layout"
import type { LeaderboardItem } from "@/lib/leaderboard-data"
import { Sparkles } from "lucide-react"

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRank, setSelectedRank] = useState<number | undefined>()
  const [selectedBid, setSelectedBid] = useState<number | undefined>()

  const { slots, refreshSponsors } = useSponsorSlots();
  const [selectedSponsorSlot, setSelectedSponsorSlot] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchLeaderboard = () => {
    setIsLoading(true);
    fetch('/api/leaderboard')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();

    // Check if user returned from Dodo checkout
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentId = params.get('payment_id');
      const status = params.get('status');
      const sponsorClaimed = params.get('sponsor_claimed');
      const slot = params.get('slot');

      if (paymentId && (status === 'succeeded' || !status)) {
        fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              if (data.type === 'sponsor') {
                setSuccessMessage(`🎉 Successfully claimed Sponsor Slot #${data.slotNumber || slot || ''} for 30 days!`);
                refreshSponsors();
              } else {
                setSuccessMessage(`🎉 Successfully claimed spot on the leaderboard for ${data.url}!`);
                fetchLeaderboard();
              }
              // Clean query param
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      } else if (sponsorClaimed) {
        setSuccessMessage(`🎉 Successfully claimed Sponsor Slot #${slot || ''} for 30 days!`);
        refreshSponsors();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleClaimClick = (rank: number, bid: number) => {
    setSelectedRank(rank)
    setSelectedBid(bid)
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
            {successMessage && (
              <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-center font-medium text-sm">
                {successMessage}
              </div>
            )}

            {/* 3-Column Layout (Left Sponsors | Center Content & Leaderboard | Right Sponsors) */}
            <div className="xl:grid xl:grid-cols-[280px_minmax(0,1fr)_280px] 2xl:grid-cols-[310px_minmax(0,1fr)_310px] gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Sponsor Slots 1 to 5 */}
              <aside className="hidden xl:flex flex-col gap-3.5 sticky top-20">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-amber-500" /> Sponsors
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">$49 / 30d</span>
                </div>
                {slots.slice(0, 5).map((slot) => (
                  <SponsorSlotCard
                    key={slot.slot_number}
                    slot={slot}
                    onClaim={setSelectedSponsorSlot}
                  />
                ))}
              </aside>

              {/* Center Column: Hero, Trending, Activity, Leaderboard */}
              <div className="w-full min-w-0 max-w-3xl mx-auto">
                <HeroSection
                  key={`${selectedRank}-${selectedBid}`}
                  ref={inputRef}
                  selectedRank={selectedRank}
                  selectedBid={selectedBid}
                  items={items}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <TrendingSection items={items} isLoading={isLoading} />
                  <LatestActivity items={items} isLoading={isLoading} />
                </div>

                {/* Mobile / Tablet Sponsors Grid (< xl screens) */}
                <div className="xl:hidden mt-10">
                  <div className="flex items-center justify-between gap-2 mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">Featured Sponsors</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300/50">
                        10 Slots
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">$49 / 30 days</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {slots.map((slot) => (
                      <SponsorSlotCard
                        key={slot.slot_number}
                        slot={slot}
                        onClaim={setSelectedSponsorSlot}
                      />
                    ))}
                  </div>
                </div>

                {/* Main Leaderboard */}
                <div className="mt-10">
                  <LeaderboardList
                    items={items}
                    isLoading={isLoading}
                    onClaimClick={handleClaimClick}
                  />
                </div>
              </div>

              {/* Right Column: Sponsor Slots 6 to 10 */}
              <aside className="hidden xl:flex flex-col gap-3.5 sticky top-20">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-amber-500" /> Sponsors
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">$49 / 30d</span>
                </div>
                {slots.slice(5, 10).map((slot) => (
                  <SponsorSlotCard
                    key={slot.slot_number}
                    slot={slot}
                    onClaim={setSelectedSponsorSlot}
                  />
                ))}
              </aside>

            </div>
          </div>
        </main>
        <Footer />

        {/* Global Sponsor Claim Modal */}
        <ClaimSponsorModal
          selectedSlot={selectedSponsorSlot}
          onClose={() => setSelectedSponsorSlot(null)}
        />
      </div>
    </MobileLayout>
  )
}