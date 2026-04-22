import { NextRequest, NextResponse } from 'next/server';
import { setPrivateData, getPrivateData } from '@/lib/atlasGenerator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BLOB_KEY = 'private-feed-data';

async function loadFromBlob(): Promise<string> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('freightwatch');
    const raw   = await store.get(BLOB_KEY, { type: 'text' });
    return (raw as string) || '';
  } catch { return ''; }
}

async function saveToBlob(data: string): Promise<void> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('freightwatch');
    await store.set(BLOB_KEY, data);
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data?.trim()) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    // Load existing from Blobs first
    const existing = getPrivateData() || await loadFromBlob();
    const updated  = existing
      ? `${existing}\n\n[${timestamp}]\n${data.trim()}`
      : `[${timestamp}]\n${data.trim()}`;

    // Store in both memory and Blobs
    setPrivateData(updated);
    await saveToBlob(updated);

    console.log('[feed] Private data saved, length:', updated.length);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET() {
  // On GET, restore from Blobs into memory if empty
  if (!getPrivateData()) {
    const blob = await loadFromBlob();
    if (blob) setPrivateData(blob);
  }
  const hasData = getPrivateData().length > 0;
  return NextResponse.json({ loaded: hasData });
}
