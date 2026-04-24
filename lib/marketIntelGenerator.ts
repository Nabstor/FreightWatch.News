import { getCachedArticles } from './fetcher';

export interface MarketIntelSection {
  title:   string;
  bullets: string[];
}

export interface MarketIntelBrief {
  id:          string;
  weekOf:      string;
  sections:    MarketIntelSection[];
  generatedAt: string;
  sources:     string[];
}

export function getMondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function getWeekKey(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

// ── Blobs persistence ─────────────────────────────────────────────

const BLOB_KEY = 'market-intel-brief';

async function readFromBlob(): Promise<MarketIntelBrief | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('freightwatch');
    const raw   = await store.get(BLOB_KEY, { type: 'text' });
    return raw ? JSON.parse(raw as string) : null;
  } catch { return null; }
}

async function writeToBlob(brief: MarketIntelBrief): Promise<void> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('freightwatch');
    await store.set(BLOB_KEY, JSON.stringify(brief));
  } catch {}
}

// In-memory cache for same-instance hits
let _brief: MarketIntelBrief | null = null;
let _briefWeek: string | null = null;

// GET path — reads from Blobs, never generates
export async function getCachedMarketIntelBrief(): Promise<MarketIntelBrief | null> {
  const thisWeek = getWeekKey();
  if (_brief && _briefWeek === thisWeek) return _brief;
  const blob = await readFromBlob();
  if (blob) {
    _brief     = blob;
    _briefWeek = thisWeek;
    return blob;
  }
  return null;
}

// ── FRED data fetchers ────────────────────────────────────────────

async function fetchCASS(): Promise<string> {
  try {
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=CASSSHIPIDX&sort_order=desc&limit=2&file_type=json&api_key=e8bc39d5bc0247c4bc26ab43c2f28b57',
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    const obs = (json?.observations || []).filter((o: { value: string }) => o.value !== '.');
    if (obs.length >= 2) {
      const curr = parseFloat(obs[0].value).toFixed(2);
      const prev = parseFloat(obs[1].value);
      const currNum = parseFloat(obs[0].value);
      const chg = ((currNum - prev) / prev * 100).toFixed(1);
      const dir = currNum >= prev ? '▲' : '▼';
      return `CASS Shipments Index: ${curr}  ${dir} ${Math.abs(parseFloat(chg))}% MoM (${obs[0].date})`;
    }
  } catch {}
  return '';
}

async function fetchCASSSPend(): Promise<string> {
  try {
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=CASSEXPIDX&sort_order=desc&limit=2&file_type=json&api_key=e8bc39d5bc0247c4bc26ab43c2f28b57',
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    const obs = (json?.observations || []).filter((o: { value: string }) => o.value !== '.');
    if (obs.length >= 2) {
      const curr = parseFloat(obs[0].value).toFixed(2);
      const prev = parseFloat(obs[1].value);
      const currNum = parseFloat(obs[0].value);
      const chg = ((currNum - prev) / prev * 100).toFixed(1);
      const dir = currNum >= prev ? '▲' : '▼';
      return `CASS Expenditures Index: ${curr}  ${dir} ${Math.abs(parseFloat(chg))}% MoM (${obs[0].date})`;
    }
  } catch {}
  return '';
}

async function fetchDiesel(): Promise<string> {
  try {
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=GASDESW&sort_order=desc&limit=2&file_type=json&api_key=e8bc39d5bc0247c4bc26ab43c2f28b57',
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    const obs = (json?.observations || []).filter((o: { value: string }) => o.value !== '.');
    if (obs.length >= 2) {
      const curr = parseFloat(obs[0].value).toFixed(3);
      const prev = parseFloat(obs[1].value);
      const chg  = (parseFloat(obs[0].value) - prev).toFixed(3);
      const dir  = parseFloat(chg) >= 0 ? '▲' : '▼';
      return `US Diesel: $${curr}/gal  ${dir} $${Math.abs(parseFloat(chg)).toFixed(3)} WoW`;
    }
  } catch {}
  return '';
}

async function fetchWTI(): Promise<string> {
  try {
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=DCOILWTICO&sort_order=desc&limit=2&file_type=json&api_key=e8bc39d5bc0247c4bc26ab43c2f28b57',
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    const obs = (json?.observations || []).filter((o: { value: string }) => o.value !== '.');
    if (obs.length >= 2) {
      const curr = parseFloat(obs[0].value).toFixed(2);
      const chg  = (parseFloat(obs[0].value) - parseFloat(obs[1].value)).toFixed(2);
      const dir  = parseFloat(chg) >= 0 ? '▲' : '▼';
      return `WTI Crude: $${curr}/bbl  ${dir} $${Math.abs(parseFloat(chg)).toFixed(2)}`;
    }
  } catch {}
  return '';
}

async function fetchBrent(): Promise<string> {
  try {
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=DCOILBRENTEU&sort_order=desc&limit=2&file_type=json&api_key=e8bc39d5bc0247c4bc26ab43c2f28b57',
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    const obs = (json?.observations || []).filter((o: { value: string }) => o.value !== '.');
    if (obs.length >= 2) {
      const curr = parseFloat(obs[0].value).toFixed(2);
      const chg  = (parseFloat(obs[0].value) - parseFloat(obs[1].value)).toFixed(2);
      const dir  = parseFloat(chg) >= 0 ? '▲' : '▼';
      return `Brent Crude: $${curr}/bbl  ${dir} $${Math.abs(parseFloat(chg)).toFixed(2)}`;
    }
  } catch {}
  return '';
}

// ── Generation (cron only) ────────────────────────────────────────

export async function generateMarketIntelBrief(): Promise<MarketIntelBrief | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const articles = await getCachedArticles();

    const intelSources = ['FreightWaves', 'DAT Freight', 'Journal of Commerce', 'JOC', 'CNBC', 'Bloomberg', 'Freightos', 'Xeneta', 'The Loadstar', 'Supply Chain Dive', 'Trucking Dive', 'Maritime Executive'];
    const relevant     = articles.filter(a => intelSources.includes(a.source));
    const sourceArticles = relevant.length >= 5 ? relevant.slice(0, 25) : articles.slice(0, 25);

    const today  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const year   = new Date().getFullYear();
    const weekOf = getMondayOfWeek();

    const [cassShip, cassSpend, diesel, wti, brent] = await Promise.all([
      fetchCASS(), fetchCASSSPend(), fetchDiesel(), fetchWTI(), fetchBrent(),
    ]);

    const liveData = [cassShip, cassSpend, diesel, wti, brent].filter(Boolean).join('\n');

    const storiesList = sourceArticles
      .map((a, i) => `${i + 1}. [${a.source}] ${a.title}${a.summary ? `\n   ${a.summary.slice(0, 250)}` : ''}`)
      .join('\n\n');

    const sources = Array.from(new Set(sourceArticles.map(a => a.source))).slice(0, 6);

    const prompt = `You are a managing director at a tier-1 investment bank covering freight, logistics, and transportation markets. Your twice-weekly intelligence brief is read by CFOs, portfolio managers, hedge fund analysts, and logistics executives who make multi-million dollar decisions based on your calls. Today is ${today}. The year is ${year}.

This is not a news summary. This is proprietary market intelligence. Give readers the interpretation, the implication, and the call — not the headline.

ANALYTICAL STANDARDS:
- Lead every bullet with the market signal, not the event. What does it MEAN, not what happened.
- Every major section must contain a directional call: BULLISH, BEARISH, or NEUTRAL with a one-line rationale.
- Connect micro data to macro implications. A diesel price move is a carrier margin event. A port delay is an inventory cost. A blank sailing is a rate signal.
- Identify where the current data diverges from consensus. What is the market underpricing or overpricing?
- Cycle awareness: are we bottoming, recovering, peaking, or in oversupply? Name it explicitly.
- Quantify impact wherever possible. If diesel moves $0.10/gal, that is ~$5,200/year per truck in fuel cost.
- Flag which carriers, shippers, or operators are structurally exposed to each development.
- Use ▲ for upward pressure, ▼ for downward pressure, → for stable/neutral, ⚠️ for high-conviction risk flags.
- Never write "data pending" or filler. If data is absent, make the call based on what you know about the cycle.
- No mention of AI, algorithms, data feeds, or how this brief is produced.

LIVE MARKET DATA:
${liveData || 'Live data unavailable this cycle — use directional analysis from articles.'}

SOURCE INTELLIGENCE for week of ${weekOf}:
${storiesList}

Return JSON with this exact structure — bullets should be 1-2 tight sentences each, analyst-grade:
{
  "sections": [
    {
      "title": "TRUCKLOAD MARKET",
      "bullets": [
        "▲/▼/→ CALL: [directional call with one-line rationale based on rate and capacity data]",
        "[Spot vs contract rate spread analysis and what it signals about cycle positioning]",
        "[Load-to-truck ratio or capacity utilisation signal and carrier pricing power implication]",
        "[One specific carrier, broker, or lane development with a forward-looking read]"
      ]
    },
    {
      "title": "OCEAN & PORTS",
      "bullets": [
        "▲/▼/→ CALL: [directional call on container rates and shipping conditions]",
        "[Trans-Pacific or Asia-Europe rate move and blank sailing/vessel supply context]",
        "[Port congestion or equipment repositioning signal and its inventory cost implication]",
        "[Trade lane or carrier alliance development with 4-week forward read]"
      ]
    },
    {
      "title": "AIR CARGO",
      "bullets": [
        "▲/▼/→ CALL: [directional call on air cargo yield and demand]",
        "[E-commerce, pharma, or tech supply chain driver of air freight demand]",
        "[Belly vs freighter capacity dynamic and its yield implication]"
      ]
    },
    {
      "title": "FUEL & ENERGY",
      "bullets": [
        "[Diesel price level with weekly change — annualised fleet cost impact for a 100-truck carrier]",
        "[Crude oil signal and what the forward curve implies for diesel in 30-60 days]",
        "⚠️ [Energy supply risk or refinery/geopolitical development with freight cost exposure]"
      ]
    },
    {
      "title": "MACRO & TRADE",
      "bullets": [
        "▲/▼/→ CALL: [directional call on freight demand from macro/trade conditions]",
        "[Tariff or trade policy development with specific volume or lane impact quantified]",
        "[Consumer demand or inventory cycle signal and what it means for inbound freight volumes]",
        "[Currency, interest rate, or economic indicator with direct freight market implication]"
      ]
    },
    {
      "title": "WEEK IN FOCUS",
      "bullets": [
        "⚠️ [The single highest-conviction call this week — the thing the market is underpricing]",
        "[Second key development with specific winner/loser identification]",
        "[One to watch: the leading indicator or catalyst that will matter most in the next 2 weeks]"
      ]
    }
  ]
}

Every bullet must deliver insight a freight executive or analyst cannot get from reading headlines. Return only valid JSON, no markdown, no backticks.`;

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 45000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 2500,
        messages:   [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data   = await res.json();
    const text   = data.content?.[0]?.text?.trim() || '';
    const clean  = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const brief: MarketIntelBrief = {
      id:          Math.random().toString(16).slice(2, 10),
      weekOf,
      sections:    parsed.sections || [],
      generatedAt: new Date().toISOString(),
      sources:     [...sources, 'FRED', 'CASS'],
    };

    _brief     = brief;
    _briefWeek = getWeekKey();

    await writeToBlob(brief);

    return brief;
  } catch (e) {
    console.error('[marketIntel] Generation failed:', e);
    return null;
  }
}
