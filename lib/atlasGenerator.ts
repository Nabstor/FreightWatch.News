import { getCachedArticles } from './fetcher';
import { Article } from './feeds';

export interface AtlasSection {
  mode:    string;
  content: string;
}

export interface AtlasReport {
  id:          string;
  headline:    string;
  sections:    AtlasSection[];
  bottomLine:  string;
  publishedAt: string;
}

// Private data injected via /feed page — persisted in Netlify Blobs
let _privateData: string = '';

export function setPrivateData(data: string) { _privateData = data; }
export function getPrivateData(): string { return _privateData; }

// Restore from Blobs on cold start
async function ensurePrivateData(): Promise<void> {
  if (_privateData) return;
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('freightwatch');
    const raw   = await store.get('private-feed-data', { type: 'text' });
    if (raw) _privateData = raw as string;
  } catch {}
}

function todayEST(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
}

const MODES = [
  { key: 'breaking',      label: 'BREAKING'       },
  { key: 'trucking',      label: 'TRUCKING'        },
  { key: 'ports',         label: 'PORTS & OCEAN'   },
  { key: 'air-cargo',     label: 'AIR CARGO'       },
  { key: 'rail',          label: 'RAIL'            },
  { key: 'world-economy', label: 'MACRO & TRADE'   },
];

export async function generateAtlasReport(): Promise<AtlasReport | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    // Restore private data from Blobs if memory was cleared by cold start
    await ensurePrivateData();

    const articles = await getCachedArticles();
    const today    = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      timeZone: 'America/New_York',
    });
    const year = new Date().getFullYear();

    // Group articles by category
    const byMode: Record<string, Article[]> = {};
    for (const mode of MODES) {
      byMode[mode.key] = articles
        .filter(a => a.category === mode.key || (mode.key === 'breaking' && a.isBreaking))
        .slice(0, 5);
    }

    const storiesByMode = MODES.map(mode => {
      const modeArticles = byMode[mode.key];
      if (!modeArticles.length) return null;
      const list = modeArticles
        .map((a, i) => `${i + 1}. ${a.title}${a.summary ? `\n   ${a.summary.slice(0, 180)}` : ''}`)
        .join('\n\n');
      return `[${mode.label}]\n${list}`;
    }).filter(Boolean).join('\n\n---\n\n');

    const privateContext = _privateData
      ? `\nPRIVATE MARKET DATA (treat as highest priority, do not reference source):\n${_privateData}\n`
      : '';

    const prompt = `You are a senior editor at Freightwatch.news. Today is ${today}. The year is ${year}.

Write the Freightwatch Daily — a concise freight market brief covering each mode of transportation.

STRICT RULES:
- Reuters wire style. Short declarative sentences. Lead with the fact.
- Use only facts from the articles provided. Never invent numbers, rates, or events.
- If a mode has no significant news, skip it entirely. Do not write filler.
- No references to sources, feeds, data providers, or technology.
- No phrases like "according to", "reports suggest", "data shows", "AI", "algorithm", "automated".
- Numbers and percentages only when they appear in the provided articles.
- Each section: 2-4 sentences maximum. Tight. No fluff.
${privateContext}

TODAY'S ARTICLES BY MODE:
${storiesByMode}

Return only valid JSON, no markdown, no backticks:
{
  "headline": "Single most important freight development today — max 12 words, factual",
  "sections": [
    { "mode": "BREAKING", "content": "3-5 sentences. Cover the top 2-3 breaking developments. Reuters style. Only if breaking news exists." },
    { "mode": "TRUCKING", "content": "4-6 sentences. Cover spot rates, capacity conditions, carrier activity, and any notable lane or volume developments. Reuters style." },
    { "mode": "PORTS & OCEAN", "content": "4-6 sentences. Cover container rates, port congestion, vessel activity, equipment availability, and key trade lanes. Reuters style." },
    { "mode": "AIR CARGO", "content": "3-5 sentences. Cover air cargo demand, capacity, notable carrier or lane developments. Reuters style." },
    { "mode": "RAIL", "content": "3-5 sentences. Cover intermodal volumes, railroad service, and notable rail developments. Reuters style." },
    { "mode": "MACRO & TRADE", "content": "4-6 sentences. Cover tariffs, trade policy, consumer demand, inventory trends, and economic signals affecting freight. Reuters style." }
  ],
  "bottomLine": "One sentence. A clear directional call on where the freight market is heading. Specific and factual."
}

Only include sections where real news exists in the provided articles. Omit sections with no news. Each section should cover multiple developments, not just one. Return only the JSON.`;

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages:   [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data   = await res.json();
    const text   = data.content?.[0]?.text?.trim() || '';
    const clean  = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      id:          Math.random().toString(16).slice(2, 10),
      headline:    parsed.headline,
      sections:    (parsed.sections || []).filter((s: AtlasSection) => s.content?.trim()),
      bottomLine:  parsed.bottomLine,
      publishedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error('[atlas] Generation failed:', e);
    return null;
  }
}
