import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';

export default function RulesPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Rules</h1>
            <div className="mt-8 space-y-8 text-sm sm:text-base">
              <section>
                <h2 className="text-base font-semibold text-foreground mb-2">How ranking works</h2>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                  <li>New listings are in whole US dollars with a $1.00 minimum ($1 at a time).</li>
                  <li>Bids already on the board keep their amount until they raise or get outranked.</li>
                  <li>Paying less than #1 still puts you on the board at whatever rank that bid can take.</li>
                  <li>Equal bids stay in the order they were placed — the earlier bid keeps the higher rank.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground mb-2">Outbidding</h2>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                  <li>Enter the same website or @handle again to raise that listing to any rank.</li>
                  <li>The new bid must be at least $1 above your current bid; you only pay the difference.</li>
                  <li>Someone else cannot take your rank by paying that difference.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground mb-2">What you can list</h2>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                  <li>A product website, or an X @handle.</li>
                  <li>Chat and invite links are not allowed — Telegram, WhatsApp, Discord, Messenger, Signal, etc.</li>
                  <li>Links to illicit or adult content are strictly not allowed.</li>
                  <li>Query parameters are stripped from listing links. Affiliate and tracking URLs are removed.</li>
                  <li>Link shorteners are not allowed. If you submit one, it is replaced by the destination URL.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground mb-2">After you pay</h2>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                  <li>Your listing is live and public immediately after payment confirmation.</li>
                  <li>Clicks go directly to the URL or profile you submitted.</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
