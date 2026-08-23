import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';
import { Scale, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export default function RulesPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-3">
                <Scale className="size-3.5" />
                Guidelines & Rules
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                Billboard <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Rules</span>
              </h1>
              <p className="text-muted-foreground mt-3 text-base sm:text-lg">
                Clear and transparent guidelines for placing and claiming billboard listings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="p-6 rounded-3xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-5 text-indigo-500" />
                  How Ranking Works
                </h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Listings are in whole US dollars with a $1.00 minimum entry bid.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Bids keep their rank on the billboard until outranked by a higher bid.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Equal bids stay in chronological order — the earlier bid holds the higher position.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-3xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                  <Sparkles className="size-5 text-amber-500" />
                  Outbidding & Upgrades
                </h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Submit your existing website or @handle to increase its position.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>You only pay the difference between your previous highest bid and your new target bid.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Your rank updates immediately upon payment confirmation.</span>
                  </li>
                </ul>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-3xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  Eligible Content
                </h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Legitimate products, startups, SaaS, portfolios, and X/Twitter creator profiles.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Clean URLs without tracking spam or affiliate redirects.</span>
                  </li>
                </ul>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-3xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                  <ShieldAlert className="size-5 text-destructive" />
                  Prohibited Content
                </h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">•</span>
                    <span>Malware, phishing, scam websites, or illicit content.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">•</span>
                    <span>Raw chat invite links (Telegram/Discord channels without landing pages).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
