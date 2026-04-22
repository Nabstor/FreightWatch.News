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

function getMondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getWeekKey(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

// Fetch CASS Freight Index from FRED (no key needed for public series)
async function fetchCASS(): Promise<string> {
  try {
    // CASSSHIPIDX = CASS Freight Shipments Index
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
      return `CASS Shipments Index: ${curr}  ${dir} ${Math.abs(parseFloat(chg))}% month-over-month (${obs[0].date})`;
    }
  } catch {}
  return '';
}

async function fetchCASSSPend(): Promise<string> {
  try {
    // CASSEXPIDX = CASS Freight Expenditures Index
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
      return `CASS Expenditures Index: ${curr}  ${dir} ${Math.abs(parseFloat(chg))}% month-over-month (${obs[0].date})`;
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
      const chg = (parseFloat(obs[0].value) - prev).toFixed(3);
      const dir = parseFloat(chg) >= 0 ? '▲' : '▼';
      return `US Diesel: $${curr}/gal  ${dir} $${Math.abs(parseFloat(chg)).toFixed(3)} week-over-week`;
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
      const chg = (parseFloat(obs[0].value) - parseFloat(obs[1].value)).toFixed(2);
      const dir = parseFloat(chg) >= 0 ? '▲' : '▼';
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
      const chg = (parseFloat(obs[0].value) - parseFloat(obs[1].value)).toFixed(2);
      const dir = parseFloat(chg) >= 0 ? '▲' : '▼';
      return `Brent Crude: $${curr}/bbl  ${dir} $${Math.abs(parseFloat(chg)).toFixed(2)}`;
    }
  } catch {}
  return '';
}

// In-memory weekly cache
let _brief: MarketIntelBrief | null = null;
let _briefWeek: string | null = null;

export async function getCachedMarketIntelBrief(): Promise<MarketIntelBrief | null> {
  const thisWeek = getWeekKey();
  if (_brief && _briefWeek === thisWeek) return _brief;
  return generateMarketIntelBrief();
}

export async function generateMarketIntelBrief(): Promise<MarketIntelBrief | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const articles = await getCachedArticles();

    // Priority sources for market intel
    const intelSources = ['FreightWaves', 'DAT Freight', 'Journal of Commerce', 'JOC', 'CNBC', 'Bloomberg', 'Freightos', 'Xeneta', 'The Loadstar', 'Supply Chain Dive'];
    const relevant = articles.filter(a => intelSources.includes(a.source));
    const sourceArticles = relevant.length >= 5 ? relevant.slice(0, 20) : articles.slice(0, 20);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const year  = new Date().getFullYear();
    const weekOf = getMondayOfWeek();

    // Fetch live FRED data in parallel
    const [cassShip, cassSpend, diesel, wti, brent] = await Promise.all([
      fetchCASS(),
      fetchCASSSPend(),
      fetchDiesel(),
      fetchWTI(),
      fetchBrent(),
    ]);

    const liveData = [cassShip, cassSpend, diesel, wti, brent].filter(Boolean).join('\n');

    const storiesList = sourceArticles
      .map((a, i) => `${i + 1}. [${a.source}] ${a.title}${a.summary ? `\n   ${a.summary.slice(0, 200)}` : ''}`)
      .join('\n\n');

    const sources = Array.from(new Set(sourceArticles.map(a => a.source))).slice(0, 6);

    const prompt = `You are a senior freight market analyst writing a weekly intelligence brief for Freightwatch.news. Today is ${today}. The year is ${year}.

Synthesize the articles below into sharp, useful bullet points for freight executives. If you don't have a specific number, describe the direction and market context instead — never write "data pending".

RULES:
- Base every bullet on what the articles actually report
- Use ▲ for up trends, ▼ for down trends, → for stable
- Flag significant developments with ⚠️
- Name specific carriers, routes, or companies when mentioned in the articles
- If no number is available, describe the trend clearly (e.g. "Spot rates trending higher as capacity tightens")
- Do NOT mention AI, algorithms, or how this brief was created
- The year is ${year} — do not reference any other year

LIVE MARKET DATA (use these exact figures where available):
${liveData}

SOURCE ARTICLES for week of ${weekOf}:
${storiesList}

Return JSON with this exact structure:
{
  "sections": [
    {
      "title": "TRUCKLOAD MARKET",
      "bullets": ["Spot rate direction and capacity conditions based on articles", "Load-to-truck ratio trend or carrier activity", "Notable lane, volume, or demand development"]
    },
    {
      "title": "OCEAN & PORTS",
      "bullets": ["Container rate direction or shipping conditions", "Port congestion, vessel delays, or shipping line news", "Trade lane or equipment availability development"]
    },
    {
      "title": "AIR CARGO",
      "bullets": ["Air cargo demand or capacity conditions", "Notable air freight development from this week", "E-commerce or express freight trend"]
    },
    {
      "title": "FUEL & ENERGY",
      "bullets": ["Diesel price direction and surcharge impact on carriers", "Crude oil market conditions and freight cost implications", "Energy disruption or supply development affecting logistics"]
    },
    {
      "title": "MACRO & TRADE",
      "bullets": ["Tariff, trade policy, or economic conditions affecting freight volumes", "Consumer demand or inventory trend impacting shipments", "Geopolitical or regulatory development with logistics implications"]
    },
    {
      "title": "WEEK IN FOCUS",
      "bullets": ["The single most important freight development this week", "Second most significant development", "Third development or one to watch next week"]
    }
  ]
}

Return only valid JSON, no markdown, no backticks.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1500,
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

    return brief;
  } catch (e) {
    console.error('[marketIntel] Generation failed:', e);
    return null;
  }
}
