import { NextRequest, NextResponse } from 'next/server';
import { getCachedMarketIntelBrief, generateMarketIntelBrief } from '@/lib/marketIntelGenerator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const brief = await getCachedMarketIntelBrief();
  if (brief) return NextResponse.json({ brief });

  // No cached brief — kick off background generation and tell client to poll.
  const baseUrl = process.env.URL || 'https://freightwatch.news';
  fetch(`${baseUrl}/.netlify/functions/market-intel-generate-bg`, { method: 'POST' }).catch(() => {});

  return NextResponse.json({ brief: null, generating: true });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const brief = await generateMarketIntelBrief();
  if (!brief) return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  return NextResponse.json({ success: true, brief });
}
