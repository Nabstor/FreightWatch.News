import type { Metadata } from 'next';
import MarketIntelClient from './MarketIntelClient';

export const metadata: Metadata = {
  title: 'Freight Market Intelligence',
  description: 'Weekly freight market intelligence brief. Truckload rates, ocean freight, air cargo, fuel prices and macro signals for logistics professionals.',
  openGraph: {
    title: 'Freight Market Intelligence | Freightwatch.news',
    description: 'Weekly freight market intelligence. Truckload rates, ocean freight, air cargo, fuel prices and macro signals.',
    url: 'https://freightwatch.news/market-intel',
  },
  alternates: { canonical: 'https://freightwatch.news/market-intel' },
};

export default function MarketIntelPage() {
  return <MarketIntelClient />;
}
