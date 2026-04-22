import type { Metadata } from 'next';
import AnalysisClient from './AnalysisClient';

export const metadata: Metadata = {
  title: 'Freightwatch Analysis',
  description: 'AI-generated daily freight market analysis. Spot rates, capacity trends, and market signals for trucking and logistics professionals.',
  openGraph: {
    title: 'Daily Freight Analysis | Freightwatch.news',
    description: 'AI-generated daily freight market analysis. Spot rates, capacity trends, and market signals.',
    url: 'https://freightwatch.news/analysis',
  },
  alternates: { canonical: 'https://freightwatch.news/analysis' },
};

export default function AnalysisPage() {
  return <AnalysisClient />;
}
