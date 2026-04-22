import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 9am digest replaced by 10am analysis email via cron-digest.mts
export async function POST() {
  return NextResponse.json({ message: 'Use /api/analysis-email instead' });
}
