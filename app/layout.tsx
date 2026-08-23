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
    default: 'Everybid · The Public Pay-to-Rank Leaderboard',
    template: '%s | Everybid',
  },
  description:
    'Everybid is a real-time public leaderboard for websites, products, and builders. Place a bid to claim your rank and get discovered.',
  keywords: ['leaderboard', 'pay to rank', 'product directory', 'rankings', 'everybid'],
  openGraph: {
    title: 'Everybid · The Public Pay-to-Rank Leaderboard',
    description:
      'Everybid is a real-time public leaderboard for websites, products, and builders. Place a bid to claim your rank and get discovered.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Everybid · The Public Pay-to-Rank Leaderboard',
    description:
      'Everybid is a real-time public leaderboard for websites, products, and builders. Place a bid to claim your rank and get discovered.',
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
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
