import type { Metadata } from 'next';
import EarningsClient from './EarningsClient';

export const metadata: Metadata = {
  title: 'Q. Earnings | Freightwatch.news',
  description: 'Quarterly earnings snapshot for the top 10 publicly traded logistics and freight companies. Revenue, EPS, beat/miss, and next report dates.',
  openGraph: {
    title: 'Logistics Q. Earnings | Freightwatch.news',
    description: 'Quarterly earnings snapshot for the top 10 publicly traded logistics and freight companies.',
    url: 'https://freightwatch.news/earnings',
  },
  alternates: { canonical: 'https://freightwatch.news/earnings' },
};

export default function EarningsPage() {
  return <EarningsClient />;
}
