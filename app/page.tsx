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
import { ClaimSuccessModal } from "@/components/claim-success-modal"
import type { LeaderboardItem } from "@/lib/leaderboard-data"

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRank, setSelectedRank] = useState<number | undefined>()
  const [selectedBid, setSelectedBid] = useState<number | undefined>()

  const { slots, refreshSponsors } = useSponsorSlots();
  const [selectedSponsorSlot, setSelectedSponsorSlot] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Success Celebration Modal State
  const [celebrationData, setCelebrationData] = useState<{
    isOpen: boolean;
    url: string;
    name?: string;
    rank?: number;
    bidAmount?: number;
    isSponsor?: boolean;
    slotNumber?: number;
  } | null>(null);

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

    // Check if user returned from PayPal checkout
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // PayPal returns ?token=ORDER_ID after user approves payment
      const paypalToken = params.get('token');
      const sponsorClaimed = params.get('sponsor_claimed');
      const slot = params.get('slot');

      if (paypalToken) {
        fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: paypalToken }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              if (data.type === 'sponsor') {
                const sNum = data.slotNumber || (slot ? Number(slot) : 1);
                setSuccessMessage(`🎉 Successfully claimed Sponsor Slot #${sNum} for 30 days!`);
                refreshSponsors();
                setCelebrationData({
                  isOpen: true,
                  url: data.url || `Sponsor Slot #${sNum}`,
                  isSponsor: true,
                  slotNumber: sNum,
                  bidAmount: 49,
                });
              } else if (data.type !== 'already_processed') {
                setSuccessMessage(`🎉 Successfully claimed spot on the leaderboard for ${data.url}!`);
                fetchLeaderboard();
                setCelebrationData({
                  isOpen: true,
                  url: data.url,
                  bidAmount: data.amountCents ? data.amountCents / 100 : undefined,
                  isSponsor: false,
                });
              }
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      } else if (sponsorClaimed) {
        const sNum = slot ? Number(slot) : 1;
        setSuccessMessage(`🎉 Successfully claimed Sponsor Slot #${sNum} for 30 days!`);
        refreshSponsors();
        setCelebrationData({
          isOpen: true,
          url: `Sponsor Slot #${sNum}`,
          isSponsor: true,
          slotNumber: sNum,
          bidAmount: 49,
        });
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
            {successMessage && (
              <div className="max-w-2xl mx-auto mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center font-medium text-sm">
                {successMessage}
              </div>
            )}

            {/* 3-Column Layout (Left Sponsors | Center Content & Leaderboard | Right Sponsors) */}
            <div className="xl:grid xl:grid-cols-[260px_minmax(0,1fr)_260px] 2xl:grid-cols-[280px_minmax(0,1fr)_280px] gap-6 items-start">
              
              {/* Left Column: Sponsor Slots 1 to 5 */}
              <aside className="hidden xl:flex flex-col gap-3 sticky top-20">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
                  <span>Sponsors</span>
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
              <div className="w-full min-w-0 max-w-2xl mx-auto">
                <HeroSection
                  key={`${selectedRank}-${selectedBid}`}
                  ref={inputRef}
                  selectedRank={selectedRank}
                  selectedBid={selectedBid}
                  items={items}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <TrendingSection items={items} isLoading={isLoading} />
                  <LatestActivity items={items} isLoading={isLoading} />
                </div>

                {/* Mobile / Tablet Sponsors Grid (< xl screens) */}
                <div className="xl:hidden mt-8">
                  <div className="flex items-center justify-between gap-2 mb-3 px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Featured Sponsors</h3>
                    <span className="text-xs text-muted-foreground font-mono">$49 / 30 days</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="mt-8 sm:mt-10">
                  <LeaderboardList
                    items={items}
                    isLoading={isLoading}
                    onClaimClick={handleClaimClick}
                  />
                </div>
              </div>

              {/* Right Column: Sponsor Slots 6 to 10 */}
              <aside className="hidden xl:flex flex-col gap-3 sticky top-20">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
                  <span>Sponsors</span>
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

        {/* Viral Claim Celebration Modal */}
        {celebrationData && (
          <ClaimSuccessModal
            isOpen={celebrationData.isOpen}
            onClose={() => setCelebrationData(null)}
            url={celebrationData.url}
            name={celebrationData.name}
            rank={celebrationData.rank}
            bidAmount={celebrationData.bidAmount}
            isSponsor={celebrationData.isSponsor}
            slotNumber={celebrationData.slotNumber}
          />
        )}
      </div>
    </MobileLayout>
  )
}