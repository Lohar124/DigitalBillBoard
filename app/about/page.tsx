import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';
import { Sparkles, Shield, Zap, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-3">
                <Sparkles className="size-3.5" />
                Pure Open Market
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                About <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Digital Billboard</span>
              </h1>
              <p className="text-muted-foreground mt-3 text-base sm:text-lg">
                The open, real-time public leaderboard where position is driven purely by the highest bid.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 rounded-3xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs flex flex-col justify-between">
                <div>
                  <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <Target className="size-5" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">No Secret Algorithms</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No black-box ranking algorithms, SEO manipulation, or hidden bias. What you bid determines your rank directly.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs flex flex-col justify-between">
                <div>
                  <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                    <Zap className="size-5" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">Fair Outbidding</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Already listed? Reclaim higher ranks by paying only the dollar difference. Your initial bid always counts toward your total.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs flex flex-col justify-between">
                <div>
                  <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Shield className="size-5" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">Instant Visibility</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Once payment completes, your product is immediately updated live on the billboard and in global activity feeds.
                  </p>
                </div>
              </div>
            </div>

            {/* Content summary card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card/60 border border-border/80 backdrop-blur-md shadow-sm space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Digital Billboard provides a live arena for indie hackers, founders, creators, and brands to showcase their work to a curious tech-savvy audience.
              </p>
              <p>
                Equal bids stay in the exact chronological order they were placed — the earlier bid holds the higher rank.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
