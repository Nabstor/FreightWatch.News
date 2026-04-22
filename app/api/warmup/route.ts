import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/lib/fetcher';
import { getCachedMarketData } from '@/lib/markets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [articles, markets] = await Promise.all([
    getCachedArticles(),
    getCachedMarketData(),
  ]);
  return NextResponse.json({
    articles: articles.length,
    fuel:     markets.fuel?.length || 0,
    warm:     true,
  });
}
