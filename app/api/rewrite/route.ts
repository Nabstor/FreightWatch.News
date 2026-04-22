import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/lib/fetcher';
import { processNextArticle, getPublishedArticles } from '@/lib/rewriter';
import { Category } from '@/lib/feeds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — return published Freightwatch articles from Blobs (instant, no AI)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const limit    = parseInt(searchParams.get('limit') || '200');

  const articles = await getPublishedArticles();

  const mapped = articles
    .filter(a => !category || a.category === category)
    .slice(0, limit)
    .map(a => ({
      id:          a.id,
      title:       a.title,
      summary:     a.summary,
      url:         `/article/${a.slug}`,
      source:      'Freightwatch Reporter',
      category:    a.category as Category,
      publishedAt: a.publishedAt,
      isBreaking:  a.importance >= 8,
      aiSummary:   a.summary,
    }));

  return NextResponse.json({ articles: mapped, total: mapped.length });
}

// POST — process ONE article from next category (called by cron every 10 min)
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First ensure RSS articles are fresh
  await fetch(`${process.env.URL || 'https://freightwatch.news'}/api/cron`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  }).catch(() => {});

  const rssArticles = await getCachedArticles();

  // Filter to freight/logistics only — skip non-freight content
  const freightKeywords = ['freight', 'truck', 'carrier', 'ship', 'port', 'cargo',
    'logistics', 'supply chain', 'rail', 'intermodal', 'ltl', 'truckload',
    'diesel', 'tariff', 'trade', 'container', 'vessel', 'warehouse',
    'fleet', 'driver', 'capacity', 'spot rate', 'contract rate', 'fuel',
    'ocean', 'maritime', 'air cargo', 'e-commerce', 'drayage', 'broker',
    'shipper', 'consignee', 'import', 'export', 'customs'];

  const freightArticles = rssArticles.filter(a => {
    const text = (a.title + ' ' + (a.summary || '')).toLowerCase();
    return freightKeywords.some(kw => text.includes(kw));
  });

  // Process the next unprocessed article
  const result = await processNextArticle(
    freightArticles.length > 0 ? freightArticles : rssArticles
  );

  return NextResponse.json(result);
}
