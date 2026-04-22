import { Article, Category, FEED_SOURCES } from './feeds';

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

function parseDate(s: string): number {
  if (!s) return 0;
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function extractImage(item: Record<string, unknown>): string | undefined {
  const enc = item['media:content'] as Record<string, unknown> | undefined;
  if (enc?.['@_url']) return enc['@_url'] as string;
  const thumb = item['media:thumbnail'] as Record<string, unknown> | undefined;
  if (thumb?.['@_url']) return thumb['@_url'] as string;
  const encl = item['enclosure'] as Record<string, unknown> | undefined;
  if (encl?.['@_url'] && (encl['@_type'] as string)?.startsWith('image/')) return encl['@_url'] as string;
  return undefined;
}

function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
}

async function fetchFeed(source: typeof FEED_SOURCES[0]): Promise<Article[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Freightwatch.news RSS Reader/1.0' },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const xml = await res.text();
    const { XMLParser } = await import('fast-xml-parser');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
    });
    const parsed = parser.parse(xml);
    const items: Record<string, unknown>[] =
      parsed?.rss?.channel?.item ||
      parsed?.feed?.entry ||
      [];
    if (!Array.isArray(items)) return [];

    return items.slice(0, 15).map((item) => {
      const title    = String(item.title || '').replace(/<[^>]+>/g, '').trim();
      const linkVal  = item.link as unknown;
      const url      = String(
        (typeof linkVal === 'object' && linkVal !== null && ('@_href' in linkVal)
          ? (linkVal as Record<string, unknown>)['@_href']
          : null)
        || (typeof linkVal === 'string' ? linkVal : null)
        || item.guid
        || ''
      ).trim();
      const summary  = String(item.description || item.summary || item.content || '')
        .replace(/<[^>]+>/g, '').slice(0, 300).trim();
      const pub      = String(item.pubDate || item.published || item.updated || '');
      const imageUrl = extractImage(item);

      if (!title || !url) return null;

      return {
        id:          hashStr(url || title),
        title,
        summary,
        url,
        source:      source.source,
        category:    source.category,
        publishedAt: pub || new Date().toISOString(),
        imageUrl,
        isBreaking:  false,
      } as Article;
    }).filter(Boolean) as Article[];
  } catch {
    return [];
  }
}

// In-memory cache
let _cache: Article[] | null = null;
let _cacheAt = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function getCachedArticles(): Promise<Article[]> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;
  return refreshArticles();
}

export async function refreshArticles(): Promise<Article[]> {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchFeed));
  const all: Article[] = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<Article[]>).value);

  // Deduplicate by URL then by title similarity
  const seenUrls  = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped = all.filter(a => {
    const tk = titleKey(a.title);
    if (seenUrls.has(a.url) || seenTitles.has(tk)) return false;
    seenUrls.add(a.url);
    seenTitles.add(tk);
    return true;
  });

  // Keyword filter — reject articles that don't match their category
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'ports':     ['port', 'ship', 'shipping', 'maritime', 'ocean', 'container', 'vessel', 'cargo ship', 'freight rate', 'liner', 'terminal', 'harbor', 'harbour', 'sea freight', 'suez', 'panama', 'strait', 'maersk', 'msc', 'cosco', 'cma cgm'],
    'air-cargo': ['air cargo', 'air freight', 'freighter', 'aviation cargo', 'cargo airline', 'iata', 'belly cargo', 'air transport', 'cargo plane', 'air shipment', 'fedex', 'ups air', 'dhl air', 'airbridge'],
    'trucking':  ['truck', 'trucking', 'carrier', 'ltl', 'truckload', 'driver', 'freight', 'load', 'hauling', 'flatbed', 'dry van', 'reefer', 'less-than-truckload', 'owner-operator', 'fleet'],
    'rail':      ['rail', 'railroad', 'intermodal', 'train', 'locomotive', 'freight rail', 'railway', 'csx', 'union pacific', 'bnsf', 'norfolk southern'],
  };

  const filtered = deduped.filter(a => {
    const keywords = CATEGORY_KEYWORDS[a.category];
    if (!keywords) return true; // no filter for breaking, market-rates, world-economy
    const text = (a.title + ' ' + a.summary).toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });

  // Rank by importance + recency + source diversity
  // Trusted/priority sources get a boost, then diversify so no source dominates
  const PRIORITY_SOURCES = new Set([
    'FreightWaves', 'Journal of Commerce', 'JOC', 'Bloomberg', 'CNBC',
    'The Loadstar', 'Maritime Executive', 'DAT Freight', 'Trucking Dive',
    'Air Cargo News', 'Supply Chain Dive', 'Railway Age',
  ]);

  const now = Date.now();
  const scored = filtered.map(a => {
    const age = now - parseDate(a.publishedAt);
    const ageHours = age / (1000 * 60 * 60);
    // Recency score: articles decay over 48 hours
    const recencyScore = Math.max(0, 1 - ageHours / 48);
    // Source priority boost
    const sourceScore = PRIORITY_SOURCES.has(a.source) ? 0.3 : 0;
    // Breaking news boost
    const breakingScore = a.isBreaking ? 0.2 : 0;
    const totalScore = recencyScore + sourceScore + breakingScore;
    return { article: a, score: totalScore };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity pass — no source more than 2 consecutive articles
  const diversified: typeof filtered = [];
  const recentSources: string[] = [];

  for (const { article } of scored) {
    const last2 = recentSources.slice(-2);
    if (last2.length === 2 && last2.every(s => s === article.source)) {
      // Push to back of queue to avoid 3 in a row
      continue;
    }
    diversified.push(article);
    recentSources.push(article.source);
  }

  // Append any skipped articles at the end
  const diversifiedIds = new Set(diversified.map(a => a.id));
  for (const { article } of scored) {
    if (!diversifiedIds.has(article.id)) diversified.push(article);
  }

  const sorted = diversified;

  // Mark top 5 breaking
  sorted.filter(a => a.category === 'breaking').slice(0, 5).forEach(a => { a.isBreaking = true; });

  _cache = sorted;
  _cacheAt = Date.now();

  // Background AI enrichment — today's articles only
  enrichWithSummaries(sorted).catch(console.error);

  return sorted;
}

// ── AI Summaries — background only, never blocks page load ───────
async function generateAISummary(article: Article): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return article.summary;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{
          role: 'user',
          content: `One sentence summary for freight professionals. Direct and factual.\n\nTitle: ${article.title}\nContent: ${article.summary}\n\nOne sentence only.`,
        }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || article.summary;
  } catch {
    return article.summary;
  }
}

async function enrichWithSummaries(articles: Article[]): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const toSummarize = articles.filter(a => {
    const articleDate = new Date(a.publishedAt).toISOString().slice(0, 10);
    return articleDate === todayStr && !a.aiSummary;
  });

  for (let i = 0; i < toSummarize.length; i += 10) {
    const batch = toSummarize.slice(i, i + 10);
    await Promise.allSettled(batch.map(async article => {
      article.aiSummary = await generateAISummary(article);
    }));
    if (i + 10 < toSummarize.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
}
