// ── Freightwatch Rewriter Agent ──────────────────────────────────
// Background architecture:
// - Cron runs every 10 minutes
// - Each run: pick 1 unprocessed article from next category
// - Rewrite it as original Freightwatch content
// - Save to Netlify Blobs
// - Frontend reads from Blobs — no AI calls on page load

import { Article, Category } from './feeds';
import { fetchFullArticle } from './articleFetcher';
import { runQualityControl } from './qualityControl';

export interface FreightwatchArticle {
  id:          string;
  slug:        string;
  title:       string;
  body:        string;
  summary:     string;
  category:    string;
  importance:  number;
  byline:      'freightwatch';
  status:      'published' | 'draft';
  publishedAt: string;
  createdAt:   string;
}

// ── Category rotation ────────────────────────────────────────────
const CATEGORY_ORDER: Category[] = [
  'trucking', 'ports', 'air-cargo', 'rail', 'breaking', 'world-economy',
];

// ── Blobs keys ───────────────────────────────────────────────────
const BLOB_ARTICLES  = 'fw-published-articles';
const BLOB_PROCESSED = 'fw-processed-urls';
const BLOB_ROTATION  = 'fw-category-index';

// ── Blobs helpers ────────────────────────────────────────────────
async function getStore() {
  const { getStore } = await import('@netlify/blobs');
  return getStore('freightwatch');
}

async function loadArticles(): Promise<FreightwatchArticle[]> {
  try {
    const store = await getStore();
    const raw   = await store.get(BLOB_ARTICLES, { type: 'text' });
    return raw ? JSON.parse(raw as string) : [];
  } catch { return []; }
}

async function saveArticles(articles: FreightwatchArticle[]): Promise<void> {
  try {
    const store = await getStore();
    // Keep max 100 articles to avoid blob size limits
    const trimmed = articles.slice(0, 100);
    await store.set(BLOB_ARTICLES, JSON.stringify(trimmed));
  } catch {}
}

async function loadProcessedUrls(): Promise<Set<string>> {
  try {
    const store = await getStore();
    const raw   = await store.get(BLOB_PROCESSED, { type: 'text' });
    return new Set(raw ? JSON.parse(raw as string) : []);
  } catch { return new Set(); }
}

async function saveProcessedUrls(urls: Set<string>): Promise<void> {
  try {
    const store = await getStore();
    // Keep last 500 URLs to avoid unbounded growth
    const arr = Array.from(urls).slice(-500);
    await store.set(BLOB_PROCESSED, JSON.stringify(arr));
  } catch {}
}

async function loadCategoryIndex(): Promise<number> {
  try {
    const store = await getStore();
    const raw   = await store.get(BLOB_ROTATION, { type: 'text' });
    return raw ? parseInt(raw as string, 10) : 0;
  } catch { return 0; }
}

async function saveCategoryIndex(idx: number): Promise<void> {
  try {
    const store = await getStore();
    await store.set(BLOB_ROTATION, String(idx));
  } catch {}
}

// ── Slugify ──────────────────────────────────────────────────────
export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// ── Rewrite a single article ─────────────────────────────────────
// fullText is the full article body from fetchFullArticle; falls back to RSS summary.
export async function rewriteArticle(article: Article, fullText?: string): Promise<FreightwatchArticle | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const sourceText = fullText || (article.summary
      ? `${article.title}. ${article.summary}`
      : article.title);

    const prompt = `You are a senior editor at Freightwatch.news. Rewrite this freight/logistics news as original Freightwatch reporting.

Rules:
- Write completely original sentences — never copy source text
- Keep all factual data points (numbers, percentages, company names)
- Reuters wire style — short declarative sentences, lead with the fact
- Never mention any source, feed, outlet, or data provider
- Never mention AI, algorithms, or technology
- 100-150 words for body
- Year is ${new Date().getFullYear()}

Source: ${sourceText.slice(0, 2000)}

Return only valid JSON:
{"title":"original headline","body":"article body 100-150 words","summary":"one sentence","importance":5}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data   = await res.json();
    const text   = data.content?.[0]?.text?.trim() || '';
    const clean  = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      id:          Math.random().toString(16).slice(2, 12),
      slug:        slugify(parsed.title),
      title:       parsed.title,
      body:        parsed.body,
      summary:     parsed.summary,
      category:    article.category,
      importance:  parsed.importance || 5,
      byline:      'freightwatch' as const,
      status:      'published' as const,
      publishedAt: new Date().toISOString(),
      createdAt:   new Date().toISOString(),
    };
  } catch (e) {
    console.error('[rewriter] Failed:', e);
    return null;
  }
}

// ── Process one article from next category ───────────────────────
// Called by cron every 10 minutes. Picks ONE unprocessed article
// from the next category in rotation, rewrites it, saves to Blobs.
export async function processNextArticle(rssArticles: Article[]): Promise<{
  processed: boolean;
  category:  string;
  title:     string | null;
  total:     number;
}> {
  // Load state from Blobs
  const [published, processedUrls, catIdx] = await Promise.all([
    loadArticles(),
    loadProcessedUrls(),
    loadCategoryIndex(),
  ]);

  // Find next category with an unprocessed article
  let found: Article | null = null;
  let foundCategory = '';
  let nextIdx = catIdx;

  for (let attempt = 0; attempt < CATEGORY_ORDER.length; attempt++) {
    const cat     = CATEGORY_ORDER[nextIdx % CATEGORY_ORDER.length];
    const catArts = rssArticles.filter(a => a.category === cat);
    const unprocessed = catArts.find(a => !processedUrls.has(a.url));

    if (unprocessed) {
      found = unprocessed;
      foundCategory = cat;
      break;
    }

    nextIdx++;
  }

  if (!found) {
    // All articles in all categories are processed
    await saveCategoryIndex((catIdx + 1) % CATEGORY_ORDER.length);
    return { processed: false, category: '', title: null, total: published.length };
  }

  console.log(`[rewriter] Processing: [${foundCategory}] ${found.title.slice(0, 60)}`);

  // Fetch full article text — falls back to RSS summary on paywall/error
  const fallback = found.summary ? `${found.title}. ${found.summary}` : found.title;
  const { text: sourceText } = await fetchFullArticle(found.url, fallback);

  // Rewrite using the richest available source text
  const rewritten = await rewriteArticle(found, sourceText);

  // Mark as processed regardless of rewrite/QC outcome
  processedUrls.add(found.url);

  let publishedTitle: string | null = null;

  if (rewritten) {
    const qcResult = await runQualityControl(rewritten, sourceText);

    if (qcResult.status === 'rejected') {
      console.log(`[rewriter] QC rejected: ${qcResult.reason}`);
    } else {
      const toPublish = qcResult.status === 'corrected' ? qcResult.article : rewritten;
      published.unshift(toPublish);
      publishedTitle = toPublish.title;
      console.log(`[rewriter] Published (QC: ${qcResult.status}): ${toPublish.title}`);
    }
  }

  // Advance category rotation and save everything
  const newIdx = (nextIdx + 1) % CATEGORY_ORDER.length;
  await Promise.all([
    saveArticles(published),
    saveProcessedUrls(processedUrls),
    saveCategoryIndex(newIdx),
  ]);

  return {
    processed: true,
    category:  foundCategory,
    title:     publishedTitle,
    total:     published.length,
  };
}

// ── Read published articles (called by frontend) ─────────────────
export async function getPublishedArticles(): Promise<FreightwatchArticle[]> {
  return loadArticles();
}

// ── Read single article by slug ──────────────────────────────────
export async function getArticleBySlug(slug: string): Promise<FreightwatchArticle | null> {
  const articles = await loadArticles();
  return articles.find(a => a.slug === slug) || null;
}
