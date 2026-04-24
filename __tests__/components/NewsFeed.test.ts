import { describe, it, expect } from 'vitest';
import { dedupe, buildCuratedFeed } from '@/components/NewsFeed';
import type { Article, Category } from '@/lib/feeds';

const makeArticle = (overrides: Partial<Article> & { id: string; title: string; category: Category }): Article => ({
  summary:     '',
  url:         `https://example.com/${overrides.id}`,
  source:      'FreightWaves',
  publishedAt: new Date().toISOString(),
  isBreaking:  false,
  ...overrides,
});

// ── dedupe ────────────────────────────────────────────────────────

describe('dedupe', () => {
  it('returns an empty array unchanged', () => {
    expect(dedupe([])).toEqual([]);
  });

  it('keeps articles with distinct titles', () => {
    const articles = [
      makeArticle({ id: '1', title: 'Trucking rates rise',        category: 'trucking' }),
      makeArticle({ id: '2', title: 'Port congestion worsens',    category: 'ports' }),
      makeArticle({ id: '3', title: 'Diesel prices hit 6-month high', category: 'trucking' }),
    ];
    expect(dedupe(articles)).toHaveLength(3);
  });

  it('removes the second article when two titles are identical', () => {
    const articles = [
      makeArticle({ id: '1', title: 'Diesel prices surge',  category: 'trucking' }),
      makeArticle({ id: '2', title: 'Diesel prices surge',  category: 'trucking' }),
    ];
    const result = dedupe(articles);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('removes duplicates regardless of title casing', () => {
    const articles = [
      makeArticle({ id: '1', title: 'Trucking Rates Rise', category: 'trucking' }),
      makeArticle({ id: '2', title: 'trucking rates rise', category: 'trucking' }),
      makeArticle({ id: '3', title: 'TRUCKING RATES RISE', category: 'trucking' }),
    ];
    const result = dedupe(articles);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('normalises punctuation when deduplicating (strips non-alphanumeric)', () => {
    // titleKey strips all non-alphanumeric chars:
    // 'Port congestion: L.A. Long Beach' → 'portcongestionlalongbeach'
    // 'Port Congestion LA Long Beach'    → 'portcongestionlalongbeach'
    const articles = [
      makeArticle({ id: '1', title: 'Port congestion: L.A. Long Beach', category: 'ports' }),
      makeArticle({ id: '2', title: 'Port Congestion LA Long Beach',     category: 'ports' }),
    ];
    const result = dedupe(articles);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('preserves the first occurrence when there are duplicates', () => {
    const articles = [
      makeArticle({ id: 'first',  title: 'Rail delays across midwest', category: 'rail' }),
      makeArticle({ id: 'second', title: 'Rail delays across midwest', category: 'rail' }),
      makeArticle({ id: 'third',  title: 'Rail delays across midwest', category: 'rail' }),
    ];
    expect(dedupe(articles)[0].id).toBe('first');
  });

  it('handles a mix of unique and duplicate titles correctly', () => {
    const articles = [
      makeArticle({ id: '1', title: 'Story A', category: 'breaking' }),
      makeArticle({ id: '2', title: 'Story B', category: 'trucking' }),
      makeArticle({ id: '3', title: 'Story A', category: 'breaking' }), // dup of 1
      makeArticle({ id: '4', title: 'Story C', category: 'ports' }),
      makeArticle({ id: '5', title: 'Story B', category: 'trucking' }), // dup of 2
    ];
    const result = dedupe(articles);
    expect(result).toHaveLength(3);
    expect(result.map(a => a.id)).toEqual(['1', '2', '4']);
  });
});

// ── buildCuratedFeed ──────────────────────────────────────────────

describe('buildCuratedFeed', () => {
  const CATEGORIES: Category[] = ['breaking', 'trucking', 'ports', 'air-cargo', 'rail', 'market-rates', 'world-economy'];

  const makeSet = (perCategory: number) =>
    CATEGORIES.flatMap((cat, ci) =>
      Array.from({ length: perCategory }, (_, i) =>
        makeArticle({ id: `${cat}-${i}`, title: `${cat} story ${i} number ${ci * perCategory + i}`, category: cat })
      )
    );

  it('returns an empty array when given no articles', () => {
    expect(buildCuratedFeed([])).toEqual([]);
  });

  it('returns all articles when total is below round-robin capacity', () => {
    const articles = [
      makeArticle({ id: 'b1',  title: 'Breaking news one',    category: 'breaking' }),
      makeArticle({ id: 't1',  title: 'Trucking story one',   category: 'trucking' }),
      makeArticle({ id: 'p1',  title: 'Ports story one',      category: 'ports' }),
    ];
    const result = buildCuratedFeed(articles);
    expect(result).toHaveLength(3);
  });

  it('interleaves articles across categories in round-robin order', () => {
    // 1 article per category
    const articles = CATEGORIES.map((cat, i) =>
      makeArticle({ id: `${cat}-0`, title: `${cat} headline ${i}`, category: cat })
    );
    const result = buildCuratedFeed(articles);

    // With 1 article per category and 1 round, output should follow CATEGORIES order
    expect(result.map(a => a.category)).toEqual(CATEGORIES);
  });

  it('never repeats an article in the output', () => {
    const articles = makeSet(3); // 3 articles per category, 21 total
    const result = buildCuratedFeed(articles);
    const ids = result.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('caps output at 80 articles', () => {
    const articles = makeSet(15); // 7 × 15 = 105 articles
    const result = buildCuratedFeed(articles);
    expect(result.length).toBeLessThanOrEqual(80);
  });

  it('produces at least 7 articles when all categories have articles', () => {
    const articles = makeSet(2);
    const result = buildCuratedFeed(articles);
    expect(result.length).toBeGreaterThanOrEqual(7);
  });

  it('skips missing categories without gaps in the output', () => {
    // Only trucking and ports articles — no breaking, air-cargo, rail etc.
    const articles = [
      makeArticle({ id: 't1', title: 'Trucking story one',   category: 'trucking' }),
      makeArticle({ id: 't2', title: 'Trucking story two',   category: 'trucking' }),
      makeArticle({ id: 'p1', title: 'Ports story one',      category: 'ports' }),
      makeArticle({ id: 'p2', title: 'Ports story two',      category: 'ports' }),
    ];
    const result = buildCuratedFeed(articles);
    expect(result.length).toBe(4);
    expect(result.some(a => a.id === undefined)).toBe(false);
  });

  it('appends leftover articles (not picked in round-robin) at the end', () => {
    // 6 articles per category → round-robin (5 rounds × 7 cats = 35) picks 35,
    // then appends the rest up to 80
    const articles = makeSet(6); // 7 × 6 = 42
    const result = buildCuratedFeed(articles);
    // All 42 unique articles should be in the output (42 < 80)
    expect(result).toHaveLength(42);
  });

  it('each category appears before any category repeats (round-robin structure)', () => {
    // With 3 articles per category the first 7 slots should be one of each category
    const articles = makeSet(3);
    const result = buildCuratedFeed(articles);

    // First 7 results: one per category, each category appears exactly once
    const firstRound = result.slice(0, 7).map(a => a.category);
    expect(new Set(firstRound).size).toBe(7);
    for (const cat of CATEGORIES) {
      expect(firstRound).toContain(cat);
    }
  });

  it('does not include articles with duplicate titles (via titleKey normalisation)', () => {
    const articles = [
      makeArticle({ id: '1', title: 'Trucking rates rise',        category: 'trucking' }),
      makeArticle({ id: '2', title: 'TRUCKING RATES RISE',        category: 'trucking' }), // dup
      makeArticle({ id: '3', title: 'Port congestion worsens',    category: 'ports' }),
    ];
    const result = buildCuratedFeed(articles);
    const ids = result.map(a => a.id);
    // Only id '1' or '2' should appear (whichever is picked first), not both
    expect(ids.includes('1') && ids.includes('2')).toBe(false);
  });
});
