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

    const prompt = `You are a Reuters correspondent with 20 years covering global freight, logistics, and financial markets. Today is ${today}. The year is ${year}.

Write the Freightwatch Daily Briefing — an authoritative, serious-minded overview of the day's logistics and financial landscape for senior supply chain, finance, and operations professionals.

WRITING STANDARDS:
- Hard Reuters wire style. Every sentence earns its place. Lead with the most significant fact.
- Treat this as a professional financial and trade publication — the tone is serious, precise, and market-oriented.
- Quantify whenever numbers appear in the source articles. Rates, percentages, volumes, prices — use them.
- Connect logistics developments to their financial and economic consequences. A port delay is also a balance sheet event. Fuel costs are margin compression. Carrier exits signal market tightening.
- Never invent data, rates, or events not present in the provided articles.
- No filler, no hedging, no passive voice where active works.
- No references to sources, data providers, feeds, or technology. No "according to", "reports show", "data indicates".
- Omit any mode that has no substantive news today. Do not write sections to fill space.
${privateContext}

TODAY'S ARTICLES BY MODE:
${storiesByMode}

Return only valid JSON, no markdown, no backticks:
{
  "headline": "The single most consequential freight or trade development today — max 14 words, declarative, factual",
  "sections": [
    { "mode": "BREAKING", "content": "4-6 sentences covering the top urgent developments. Hard news first. Only include if genuinely breaking." },
    { "mode": "TRUCKING", "content": "5-7 sentences. Cover spot rate movements, load-to-truck ratios, capacity conditions, carrier financial health, notable lane developments, and volume trends. Connect rate moves to broader economic conditions." },
    { "mode": "PORTS & OCEAN", "content": "5-7 sentences. Cover container spot rates on key trade lanes, port congestion, vessel utilisation, blank sailings, equipment repositioning, and any trade policy affecting ocean freight." },
    { "mode": "AIR CARGO", "content": "4-6 sentences. Cover yield trends, belly vs freighter capacity, demand drivers, key lane dynamics, and any e-commerce or pharma developments affecting air freight volumes." },
    { "mode": "RAIL", "content": "4-6 sentences. Cover intermodal volumes, service reliability metrics, car loadings, and any labour or infrastructure developments at Class I railroads." },
    { "mode": "MACRO & TRADE", "content": "5-7 sentences. Cover tariff developments, trade policy shifts, currency moves affecting freight costs, consumer demand signals, inventory cycle positioning, and any central bank actions with supply chain implications." }
  ],
  "bottomLine": "One sentence. A precise directional assessment of where the freight market is heading and why. Name the primary force driving it."
}

Only include sections where real, substantive news exists in the provided articles. Each section must cover multiple distinct developments. Return only the JSON.`;

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
        model:      'claude-sonnet-4-6',
        max_tokens: 2000,
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
