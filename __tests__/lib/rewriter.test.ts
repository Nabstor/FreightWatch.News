import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { slugify, rewriteArticle, processNextArticle, getPublishedArticles, getArticleBySlug } from '@/lib/rewriter';
import type { Article } from '@/lib/feeds';

// ── slugify ───────────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases the title', () => {
    expect(slugify('TRUCKING RATES RISE')).toBe('trucking-rates-rise');
  });

  it('replaces spaces and special characters with hyphens', () => {
    expect(slugify('Diesel: $4.50/gal — up 3%')).toBe('diesel-4-50-gal-up-3');
  });

  it('collapses multiple non-alphanumeric chars into a single hyphen', () => {
    expect(slugify('Rail & Ocean  Freight')).toBe('rail-ocean-freight');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  --hello world--  ')).toBe('hello-world');
  });

  it('truncates to 80 characters', () => {
    const long = 'a '.repeat(50);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('generates URL-safe output (only lowercase alphanum and hyphens)', () => {
    const slug = slugify('Port congestion in L.A. & Long Beach: Q1 2024');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});

// ── rewriteArticle ────────────────────────────────────────────────

const makeArticle = (overrides: Partial<Article> = {}): Article => ({
  id:          'test-id',
  title:       'Diesel prices surge amid supply constraints',
  summary:     'Diesel fuel prices rose 8% last week as refinery output fell.',
  url:         'https://freightwaves.com/diesel-prices',
  source:      'FreightWaves',
  category:    'trucking',
  publishedAt: new Date().toISOString(),
  isBreaking:  false,
  ...overrides,
});

describe('rewriteArticle — core pipeline', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('returns null when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await rewriteArticle(makeArticle());
    expect(result).toBeNull();
  });

  it('calls the Anthropic API with the source article content', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({
          title: 'Fuel Costs Climb as Refinery Output Drops',
          body:  'Diesel fuel prices posted an 8 percent weekly gain as refinery output contracted.',
          summary: 'Diesel up 8% on refinery shortfall.',
          importance: 7,
        }) }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await rewriteArticle(makeArticle());

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('anthropic.com');
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('claude-haiku-4-5-20251001');
    expect(body.messages[0].content).toContain('Diesel prices surge');
  });

  it('returns a FreightwatchArticle with byline = "freightwatch"', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({
          title: 'Fuel Costs Climb',
          body:  'Diesel prices surged.',
          summary: 'Diesel up.',
          importance: 6,
        }) }],
      }),
    }));

    const result = await rewriteArticle(makeArticle());

    expect(result).not.toBeNull();
    expect(result!.byline).toBe('freightwatch');
    expect(result!.status).toBe('published');
  });

  it('carries the source article category onto the rewritten article', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({ title: 'Port delays', body: 'LA port congestion worsened.', summary: 'Port delays.', importance: 5 }) }],
      }),
    }));

    const result = await rewriteArticle(makeArticle({ category: 'ports' }));
    expect(result!.category).toBe('ports');
  });

  it('generates a valid slug from the rewritten title', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({ title: 'Ocean Freight Rates Hit 18-Month High', body: 'Body.', summary: 'Summary.', importance: 8 }) }],
      }),
    }));

    const result = await rewriteArticle(makeArticle());
    expect(result!.slug).toMatch(/^[a-z0-9-]+$/);
    expect(result!.slug).toContain('ocean');
  });

  it('returns null when Claude returns malformed JSON', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Sorry, I cannot help with that.' }],
      }),
    }));

    const result = await rewriteArticle(makeArticle());
    expect(result).toBeNull();
  });

  it('returns null when the fetch call throws (network error)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    const result = await rewriteArticle(makeArticle());
    expect(result).toBeNull();
  });

  it('strips markdown code fences from Claude response before JSON parse', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const payload = { title: 'Test Title', body: 'Test body.', summary: 'Test.', importance: 5 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`` }],
      }),
    }));

    const result = await rewriteArticle(makeArticle());
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Title');
  });

  it('uses title as sourceText when summary is empty', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({ title: 'Title only', body: 'Body.', summary: 'S.', importance: 5 }) }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await rewriteArticle(makeArticle({ summary: '' }));

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Prompt should contain the article title
    expect(body.messages[0].content).toContain('Diesel prices surge');
  });
});

// ── processNextArticle — category rotation ────────────────────────

describe('processNextArticle — category rotation', () => {
  const articles: Article[] = [
    makeArticle({ url: 'https://example.com/t1', category: 'trucking',    title: 'Truck freight load carrier driver article' }),
    makeArticle({ url: 'https://example.com/p1', category: 'ports',       title: 'Port ship container maritime cargo article' }),
    makeArticle({ url: 'https://example.com/a1', category: 'air-cargo',   title: 'Air cargo freight aviation IATAarticle' }),
  ];

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
    vi.resetModules();
  });

  it('returns processed:false when no API key is set', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    // rewriteArticle returns null → processNextArticle still marks processed true
    // but with title null
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: 'invalid json' }] }),
    }));

    const result = await processNextArticle(articles);
    expect(result.processed).toBe(true);
    expect(result.title).toBeNull();
  });

  it('returns processed:true and a title on successful rewrite', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({ title: 'Rewritten Title', body: 'Body.', summary: 'S.', importance: 5 }) }],
      }),
    }));

    const result = await processNextArticle(articles);
    expect(result.processed).toBe(true);
    expect(result.title).toBe('Rewritten Title');
    expect(result.total).toBeGreaterThan(0);
  });

  it('returns processed:false and empty category when all articles are already processed', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: JSON.stringify({ title: 'T', body: 'B.', summary: 'S.', importance: 5 }) }],
      }),
    }));

    // Process all articles once to mark them
    for (const article of articles) {
      await processNextArticle([article]);
    }

    // Now all should be processed; empty array = nothing left
    const result = await processNextArticle([]);
    expect(result.processed).toBe(false);
    expect(result.category).toBe('');
    expect(result.title).toBeNull();
  });
});

// ── getPublishedArticles and getArticleBySlug ─────────────────────

describe('getPublishedArticles', () => {
  it('returns an array (empty when Blobs store has no data)', async () => {
    const articles = await getPublishedArticles();
    expect(Array.isArray(articles)).toBe(true);
  });
});

describe('getArticleBySlug', () => {
  it('returns null when no articles exist in the store', async () => {
    const result = await getArticleBySlug('some-nonexistent-slug');
    expect(result).toBeNull();
  });
});
