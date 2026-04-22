import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport } from '@/lib/atlas';
import { sendAnalysisEmail } from '@/lib/brevo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const report = await getCachedReport();
  if (!report) return NextResponse.json({ error: 'No report available' }, { status: 404 });
  const sent = await sendAnalysisEmail(report);
  return NextResponse.json({ success: sent });
}
