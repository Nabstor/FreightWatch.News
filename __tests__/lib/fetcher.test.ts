import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashStr, parseDate, extractImage, titleKey, refreshArticles, clearArticleCache } from '@/lib/fetcher';

// ── Module-level mock so integration tests have a small, controlled FEED_SOURCES ──
vi.mock('@/lib/feeds', () => ({
  CATEGORIES: {
    trucking:       { label: 'Trucking',       color: '#1a5c2a' },
    ports:          { label: 'Ports',          color: '#0a5c8a' },
    'world-economy':{ label: 'World Economy',  color: '#333333' },
    breaking:       { label: 'Breaking',       color: '#d0021b' },
    'air-cargo':    { label: 'Air Cargo',      color: '#6b3fa0' },
    rail:           { label: 'Rail',           color: '#8a4a0a' },
    'market-rates': { label: 'Market Intel',   color: '#0a5c8a' },
  },
  FEED_SOURCES: [
    { url: 'https://fw.com/trucking',   source: 'FreightWaves',       category: 'trucking',       trusted: true  },
    { url: 'https://td.com/feed',       source: 'Trucking Dive',      category: 'trucking',       trusted: true  },
    { url: 'https://me.com/rss',        source: 'Maritime Executive', category: 'ports',          trusted: true  },
    { url: 'https://econ.com/feed',     source: 'Bloomberg',          category: 'world-economy',  trusted: false },
    { url: 'https://fw.com/breaking',   source: 'FreightWaves',       category: 'breaking',       trusted: true  },
  ],
}));

// ── Pure function unit tests ───────────────────────────────────────

describe('hashStr', () => {
  it('returns an 8-character hex string', () => {
    expect(hashStr('hello')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic', () => {
    expect(hashStr('https://example.com/article')).toBe(hashStr('https://example.com/article'));
  });

  it('returns different hashes for different inputs', () => {
    expect(hashStr('article-a')).not.toBe(hashStr('article-b'));
  });

  it('handles empty string without throwing', () => {
    expect(() => hashStr('')).not.toThrow();
  });
});

describe('parseDate', () => {
  it('parses ISO 8601 strings', () => {
    expect(parseDate('2024-01-15T10:00:00Z')).toBe(new Date('2024-01-15T10:00:00Z').getTime());
  });

  it('parses RFC 2822 strings (RSS pubDate format)', () => {
    const ts = parseDate('Mon, 15 Jan 2024 10:00:00 +0000');
    expect(ts).toBeGreaterThan(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseDate('')).toBe(0);
  });

  it('returns 0 for invalid date string', () => {
    expect(parseDate('not-a-date')).toBe(0);
  });

  it('returns a number for a valid date', () => {
    expect(typeof parseDate('2024-06-01')).toBe('number');
    expect(parseDate('2024-06-01')).toBeGreaterThan(0);
  });
});

describe('extractImage', () => {
  it('extracts from media:content', () => {
    const item = { 'media:content': { '@_url': 'https://img.com/a.jpg' } };
    expect(extractImage(item)).toBe('https://img.com/a.jpg');
  });

  it('extracts from media:thumbnail when media:content is absent', () => {
    const item = { 'media:thumbnail': { '@_url': 'https://img.com/thumb.jpg' } };
    expect(extractImage(item)).toBe('https://img.com/thumb.jpg');
  });

  it('extracts from enclosure when type is image/*', () => {
    const item = { enclosure: { '@_url': 'https://img.com/enc.jpg', '@_type': 'image/jpeg' } };
    expect(extractImage(item)).toBe('https://img.com/enc.jpg');
  });

  it('ignores enclosure when type is not image/*', () => {
    const item = { enclosure: { '@_url': 'https://audio.com/pod.mp3', '@_type': 'audio/mpeg' } };
    expect(extractImage(item)).toBeUndefined();
  });

  it('returns undefined when no image field is present', () => {
    expect(extractImage({ title: 'No image here' })).toBeUndefined();
  });

  it('prefers media:content over media:thumbnail', () => {
    const item = {
      'media:content':   { '@_url': 'https://img.com/full.jpg' },
      'media:thumbnail': { '@_url': 'https://img.com/thumb.jpg' },
    };
    expect(extractImage(item)).toBe('https://img.com/full.jpg');
  });
});

describe('titleKey', () => {
  it('lowercases the title', () => {
    expect(titleKey('TRUCK RATES RISE')).toBe('truckratesrise');
  });

  it('strips non-alphanumeric characters', () => {
    expect(titleKey('Diesel: $4.50/gal — up 3%')).toBe('diesel450galup3');
  });

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(100);
    expect(titleKey(long).length).toBe(60);
  });

  it('produces the same key for semantically identical titles', () => {
    expect(titleKey('Trucking Rates Rise')).toBe(titleKey('trucking rates rise'));
  });

  it('produces different keys for different titles', () => {
    expect(titleKey('Port congestion in LA')).not.toBe(titleKey('Rail delays across midwest'));
  });
});

// ── Helpers ───────────────────────────────────────────────────────

const rss = (items: { title: string; url: string; desc?: string; pubDate?: string }[]) =>
  `<?xml version="1.0"?><rss version="2.0"><channel>${items.map(it => `
<item>
  <title>${it.title}</title>
  <link>${it.url}</link>
  <description>${it.desc ?? it.title}</description>
  <pubDate>${it.pubDate ?? 'Thu, 24 Apr 2025 10:00:00 +0000'}</pubDate>
</item>`).join('')}</channel></rss>`;

// FEED_SOURCES (mocked above): fw.com/trucking, td.com/feed, me.com/rss, econ.com/feed, fw.com/breaking

// ── Integration tests for refreshArticles pipeline ────────────────

describe('refreshArticles — deduplication and pipeline', () => {
  beforeEach(() => clearArticleCache());
  afterEach(() => vi.unstubAllGlobals());

  it('returns only unique URLs (no duplicate article URLs)', async () => {
    const sameUrl = 'https://fw.com/truck-rates-1';
    const xml = rss([{ title: 'Trucking freight carrier driver rates load', url: sameUrl }]);
    // All 5 mock feeds return the same article at the same URL
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }));

    const articles = await refreshArticles();

    const urls = articles.map(a => a.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('deduplicates articles with identical title keys across sources', async () => {
    let call = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      call++;
      const title = call === 1
        ? 'Truck freight carrier driver rates load decline'
        : 'Truck Freight Carrier Driver Rates Load Decline'; // same title key, different casing
      const url = `https://fw.com/art-${call}`;
      return Promise.resolve({ ok: true, text: () => Promise.resolve(rss([{ title, url }])) });
    }));

    const articles = await refreshArticles();

    const tk = titleKey('Truck freight carrier driver rates load decline');
    const matches = articles.filter(a => titleKey(a.title) === tk);
    // After title-key dedup only 1 should survive
    expect(matches.length).toBe(1);
  });

  it('filters out articles that do not match their category keywords', async () => {
    // "Celebrity gossip" contains none of the trucking/ports/rail/air-cargo keywords
    const xml = rss([{ title: 'Celebrity gossip pop star entertainment news', url: 'https://fw.com/gossip' }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }));

    const articles = await refreshArticles();

    const offTopic = articles.find(a => a.title.toLowerCase().includes('celebrity'));
    expect(offTopic).toBeUndefined();
  });

  it('allows world-economy articles through regardless of freight keywords', async () => {
    // econ.com/feed maps to category 'world-economy' in our mock FEED_SOURCES.
    // world-economy has no keyword filter so any article passes.
    let call = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      call++;
      const isEcon = url === 'https://econ.com/feed';
      const xml = rss([{
        title: isEcon ? 'Global tariff shifts affect trade flows' : `Truck freight carrier driver rates ${call}`,
        url:   isEcon ? 'https://econ.com/tariff-1' : `https://fw.com/truck-${call}`,
      }]);
      return Promise.resolve({ ok: true, text: () => Promise.resolve(xml) });
    }));

    const articles = await refreshArticles();

    expect(articles.some(a => a.category === 'world-economy')).toBe(true);
  });

  it('returns an array (possibly empty) when all feeds fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const articles = await refreshArticles();
    expect(Array.isArray(articles)).toBe(true);
  });

  it('marks at most 5 breaking-category articles as isBreaking', async () => {
    let call = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      call++;
      const isBreaking = url === 'https://fw.com/breaking';
      const items = isBreaking
        ? Array.from({ length: 8 }, (_, i) => ({
            title: `Breaking freight news ${i}`,
            url:   `https://fw.com/breaking/${i}`,
          }))
        : [{ title: `Truck freight carrier driver ${call}`, url: `https://fw.com/truck-${call}` }];
      return Promise.resolve({ ok: true, text: () => Promise.resolve(rss(items)) });
    }));

    const articles = await refreshArticles();

    const marked = articles.filter(a => a.isBreaking);
    expect(marked.length).toBeLessThanOrEqual(5);
  });
});

describe('refreshArticles — source diversity pass', () => {
  beforeEach(() => clearArticleCache());
  afterEach(() => vi.unstubAllGlobals());

  it('never places 3 consecutive articles from the same source in the diversified portion', async () => {
    // fw.com/trucking (FreightWaves) returns 4 trucking articles
    // td.com/feed (Trucking Dive) returns 1 trucking article
    // Other feeds return nothing
    let call = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      call++;
      if (url === 'https://fw.com/trucking') {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(rss(
          Array.from({ length: 4 }, (_, i) => ({
            title: `FreightWaves trucking carrier driver freight load ${i}`,
            url:   `https://fw.com/truck-fw-${i}`,
            pubDate: `Thu, 24 Apr 2025 ${String(12 - i).padStart(2, '0')}:00:00 +0000`,
          }))
        ))});
      }
      if (url === 'https://td.com/feed') {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(rss([
          { title: 'Trucking Dive carrier driver freight rates load', url: 'https://td.com/art-1' },
        ]))});
      }
      return Promise.resolve({ ok: false });
    }));

    const articles = await refreshArticles();

    // Verify no 3 consecutive articles from the same source in the leading positions
    for (let i = 0; i <= articles.length - 3; i++) {
      const allSame = articles[i].source === articles[i + 1].source &&
                      articles[i].source === articles[i + 2].source;
      // The diversity pass only applies to the primary sorted section.
      // Appended stragglers can form runs — only check positions before the break point.
      // With 4 FW + 1 TD: diversified = [FW, FW, TD, FW], appended = [FW]
      // So positions 0..2 should have no 3-in-a-row.
      if (i < 2) expect(allSame).toBe(false);
    }
  });
});
