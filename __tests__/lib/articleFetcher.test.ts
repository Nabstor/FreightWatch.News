import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchFullArticle } from '@/lib/articleFetcher';

const FALLBACK = 'RSS fallback summary text.';

const makeHtmlResponse = (body: string) => ({
  ok: true,
  text: () => Promise.resolve(body),
});

describe('fetchFullArticle — happy path', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns full:true and extracted text when article is accessible', async () => {
    const html = `<html><body>
      <p>Diesel fuel prices rose sharply this week as refinery utilization dropped to its lowest level since January.
      Carriers across the Midwest reported surcharge increases of between 3 and 5 cents per mile.
      The EIA weekly survey showed average retail diesel at $3.95 per gallon, up from $3.87 the prior week.
      Analysts expect prices to remain elevated through the end of the quarter given seasonal refinery maintenance.
      LTL carriers have already announced fuel surcharge table updates effective next Monday.
      Truckload spot rates are also responding to the higher operating costs with load boards showing upward pressure.</p>
    </body></html>`;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeHtmlResponse(html)));

    const result = await fetchFullArticle('https://example.com/article', FALLBACK);

    expect(result.full).toBe(true);
    expect(result.text.length).toBeGreaterThan(FALLBACK.length);
  });

  it('prefers full article text over short fallback when full text is longer', async () => {
    const richHtml = `<html><body><p>${'Trucking carriers reported strong demand in Q1. '.repeat(20)}</p></body></html>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeHtmlResponse(richHtml)));

    const result = await fetchFullArticle('https://example.com/rich', FALLBACK);
    expect(result.text.length).toBeGreaterThan(FALLBACK.length);
  });
});

describe('fetchFullArticle — paywall detection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const PAYWALL_SIGNALS = [
    'subscribe to read',
    'subscription required',
    'sign in to read',
    'create a free account',
    'to continue reading',
    'premium content',
    'members only',
    'paid subscribers',
    'unlock this article',
  ];

  for (const signal of PAYWALL_SIGNALS) {
    it(`detects paywall signal: "${signal}"`, async () => {
      const html = `<html><body><p>Some intro text. ${signal}. Please subscribe.</p></body></html>`;
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeHtmlResponse(html)));

      const result = await fetchFullArticle('https://paywalled.com/article', FALLBACK);

      expect(result.full).toBe(false);
      expect(result.text).toBe(FALLBACK);
    });
  }
});

describe('fetchFullArticle — thin content fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back when extracted text is below 300 chars', async () => {
    const html = '<html><body><p>Short.</p></body></html>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeHtmlResponse(html)));

    const result = await fetchFullArticle('https://example.com/thin', FALLBACK);

    expect(result.full).toBe(false);
    expect(result.text).toBe(FALLBACK);
  });
});

describe('fetchFullArticle — HTML stripping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('strips script tags from the response', async () => {
    const html = `<html><body>
      <script>alert("xss")</script>
      <p>${'Freight market update with real content. '.repeat(15)}</p>
    </body></html>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeHtmlResponse(html)));

    const result = await fetchFullArticle('https://example.com/scripts', FALLBACK);

    expect(result.text).not.toContain('alert');
    expect(result.text).not.toContain('<script');
  });

  it('strips style tags from the response', async () => {
    const html = `<html><head><style>body { color: red; }</style></head><body>
      <p>${'Supply chain disruption continues this week. '.repeat(15)}</p>
    </body></html>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeHtmlResponse(html)));

    const result = await fetchFullArticle('https://example.com/styles', FALLBACK);

    expect(result.text).not.toContain('color: red');
  });

  it('strips nav and footer elements', async () => {
    const html = `<html><body>
      <nav>Home | About | Contact</nav>
      <p>${'Ocean freight rates climbed 12 percent week over week. '.repeat(15)}</p>
      <footer>Copyright 2025</footer>
    </body></html>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeHtmlResponse(html)));

    const result = await fetchFullArticle('https://example.com/nav', FALLBACK);

    expect(result.text).not.toContain('Copyright 2025');
    expect(result.text).not.toContain('Home | About');
  });
});

describe('fetchFullArticle — error handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back when fetch returns a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    const result = await fetchFullArticle('https://example.com/forbidden', FALLBACK);

    expect(result.full).toBe(false);
    expect(result.text).toBe(FALLBACK);
  });

  it('falls back when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));

    const result = await fetchFullArticle('https://example.com/down', FALLBACK);

    expect(result.full).toBe(false);
    expect(result.text).toBe(FALLBACK);
  });
});
