import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber } from '@/lib/brevo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  const ok = await addSubscriber(email);
  if (!ok) return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
