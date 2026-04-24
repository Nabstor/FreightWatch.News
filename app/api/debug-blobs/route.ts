import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/rewriter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const articles = await getPublishedArticles();
    return NextResponse.json({
      count: articles.length,
      slugs: articles.map(a => a.slug),
      titles: articles.map(a => ({ slug: a.slug, title: a.title, publishedAt: a.publishedAt })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
