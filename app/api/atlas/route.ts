import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport, forceRefreshReport } from '@/lib/atlas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const report = await getCachedReport();
  if (!report) return NextResponse.json({ reports: [], total: 0 });
  return NextResponse.json({ reports: [report], total: 1 });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const report = await forceRefreshReport();
  if (!report) return NextResponse.json({ error: 'Failed' }, { status: 500 });
  return NextResponse.json({ success: true, report });
}
