import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'WealthTrack — Smart Portfolio Tracker',
  description:
    'Track stocks, ETFs, crypto, and funds from all your brokers in one sleek dashboard. Real-time prices, beautiful charts, and detailed analytics.',
  keywords: 'portfolio tracker, investment tracker, stocks, ETF, crypto, wealth management',
  openGraph: {
    title: 'WealthTrack — Smart Portfolio Tracker',
    description: 'Track all your investments in one place.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
