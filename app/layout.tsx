import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Digital Billboard · The Public Pay-to-Rank Leaderboard',
    template: '%s | Digital Billboard',
  },
  description:
    'Digital Billboard is a real-time public leaderboard for websites, products, and builders. Place a bid to claim your rank and get discovered.',
  keywords: ['leaderboard', 'pay to rank', 'digital billboard', 'billboard', 'product directory', 'rankings'],
  openGraph: {
    title: 'Digital Billboard · The Public Pay-to-Rank Leaderboard',
    description:
      'Digital Billboard is a real-time public leaderboard for websites, products, and builders. Place a bid to claim your rank and get discovered.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Billboard · The Public Pay-to-Rank Leaderboard',
    description:
      'Digital Billboard is a real-time public leaderboard for websites, products, and builders. Place a bid to claim your rank and get discovered.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', inter.variable)}
    >
      <body className="min-h-screen relative overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-400">
        {/* Ambient Glowing Orbs */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[450px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-amber-500/10 blur-[130px] rounded-full animate-pulse-slow" />
          <div className="absolute top-[40%] -left-40 w-[450px] h-[450px] bg-indigo-500/10 blur-[140px] rounded-full" />
          <div className="absolute top-[60%] -right-40 w-[450px] h-[450px] bg-amber-500/10 blur-[140px] rounded-full" />
        </div>

        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
