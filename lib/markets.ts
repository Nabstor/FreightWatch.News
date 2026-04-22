// ── Daily cache — populated by 9am cron ──────────────────────────
let _cache: MarketData | null = null;
let _cacheDate: string | null = null;

function todayEST(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
}

export interface FuelPrice {
  label:  string;
  value:  string;
  unit:   string;
  change: number;
}

export interface MarketData {
  fuel:      FuelPrice[];
  updatedAt: string;
}

async function fetchYahooQuote(symbol: string): Promise<{ price: number; prev: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      price: meta.regularMarketPrice,
      prev:  meta.chartPreviousClose || meta.regularMarketPrice,
    };
  } catch { return null; }
}

async function fetchFuelPrices(): Promise<FuelPrice[]> {
  const FUEL_SYMBOLS = [
    { symbol: 'HO=F', label: 'US Diesel',   unit: '$/gal' },
    { symbol: 'CL=F', label: 'WTI Crude',   unit: '$/bbl' },
    { symbol: 'BZ=F', label: 'Brent Crude', unit: '$/bbl' },
  ];

  const results: FuelPrice[] = [];

  await Promise.allSettled(FUEL_SYMBOLS.map(async (item) => {
    const quote = await fetchYahooQuote(item.symbol);
    if (!quote) return;
    const change   = quote.price - quote.prev;
    const decimals = item.unit === '$/gal' ? 4 : 2;
    results.push({
      label:  item.label,
      value:  quote.price.toFixed(decimals),
      unit:   item.unit,
      change: parseFloat(change.toFixed(decimals)),
    });
  }));

  const order = ['US Diesel', 'WTI Crude', 'Brent Crude'];
  results.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  return results;
}

export async function fetchAllMarketData(): Promise<MarketData> {
  const fuel = await fetchFuelPrices();
  const data: MarketData = { fuel, updatedAt: new Date().toISOString() };
  _cache     = data;
  _cacheDate = todayEST();
  return data;
}

export async function getCachedMarketData(): Promise<MarketData> {
  if (_cache && _cacheDate === todayEST()) return _cache;
  return fetchAllMarketData();
}
