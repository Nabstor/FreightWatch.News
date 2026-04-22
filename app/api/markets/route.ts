import { NextResponse } from 'next/server';
import { getCachedMarketData, fetchAllMarketData } from '@/lib/markets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — serve from daily cache (fast for every visitor)
export async function GET() {
  const data = await getCachedMarketData();
  return NextResponse.json(data);
}

// POST — called by 9am cron to refresh cache
export async function POST() {
  const data = await fetchAllMarketData();
  return NextResponse.json({ success: true, updatedAt: data.updatedAt });
}
