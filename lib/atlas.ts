import { AtlasReport, generateAtlasReport } from './atlasGenerator';

const BLOB_KEY = 'atlas-daily-report';

function todayEST(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
}

async function readFromBlob(): Promise<{ date: string; report: AtlasReport } | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('freightwatch');
    const raw   = await store.get(BLOB_KEY, { type: 'text' });
    if (!raw) return null;
    return JSON.parse(raw as string) || null;
  } catch { return null; }
}

async function writeToBlob(date: string, report: AtlasReport): Promise<void> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('freightwatch');
    await store.set(BLOB_KEY, JSON.stringify({ date, report }));
  } catch {}
}

let _report: AtlasReport | null = null;
let _reportDate: string | null  = null;

export async function getCachedReport(): Promise<AtlasReport | null> {
  const today = todayEST();
  if (_report && _reportDate === today) return _report;
  const blob = await readFromBlob();
  if (blob && blob.date === today) {
    _report     = blob.report;
    _reportDate = today;
    return blob.report;
  }
  return forceRefreshReport();
}

export async function forceRefreshReport(): Promise<AtlasReport | null> {
  const today  = todayEST();
  const report = await generateAtlasReport();
  if (report) {
    _report     = report;
    _reportDate = today;
    await writeToBlob(today, report);
  }
  return report;
}
