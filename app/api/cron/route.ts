import { NextRequest, NextResponse } from 'next/server';
import { refreshArticles } from '@/lib/fetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const articles = await refreshArticles();
  return NextResponse.json({ success: true, count: articles.length });
}
