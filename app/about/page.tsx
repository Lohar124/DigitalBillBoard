import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';

export default function AboutPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold tracking-tight">About</h1>
            <div className="mt-8 space-y-6 text-muted-foreground">
              <p>
                Digital Billboard is a real-time, pay-to-rank public leaderboard for websites, products, and builders. There are no ads, no algorithms, and no sponsorships. Rank is purely determined by the bid — nothing else.
              </p>
              <p>
                The concept is simple: choose any website or @handle and place a bid. The higher your bid, the higher your position on the leaderboard. If someone outbids you, you can easily top up your bid by paying only the difference to reclaim your spot.
              </p>
              <p>
                Equal bids stay in the order they were placed — the earlier bid holds the higher rank.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
