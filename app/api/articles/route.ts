import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/lib/fetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const limit    = parseInt(searchParams.get('limit') || '200', 10);

  let articles = await getCachedArticles();
  if (category) articles = articles.filter(a => a.category === category);
  articles = articles.slice(0, limit);

  return NextResponse.json({ articles, total: articles.length, fetchedAt: new Date().toISOString() });
}
